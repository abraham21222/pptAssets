const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();
const PORT = 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/extracted', express.static(path.join(__dirname, '../extracted')));
app.use('/', express.static(path.join(__dirname, '../client')));

// Serve the refreshed interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\.[^/.]+$/, "");
    const ext = path.extname(file.originalname);
    cb(null, `${originalName}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PowerPoint files (.ppt, .pptx) are allowed'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Asset library storage
let assetLibrary = [];
const ASSET_LIBRARY_FILE = path.join(__dirname, '../asset-library.json');

// Load existing asset library
async function loadAssetLibrary() {
  try {
    const data = await fs.readFile(ASSET_LIBRARY_FILE, 'utf8');
    assetLibrary = JSON.parse(data);
    console.log(`Loaded ${assetLibrary.length} assets from library`);
  } catch (error) {
    console.log('No existing asset library found, starting fresh');
    assetLibrary = [];
  }
}

// Save asset library
async function saveAssetLibrary() {
  try {
    await fs.writeFile(ASSET_LIBRARY_FILE, JSON.stringify(assetLibrary, null, 2));
    console.log('Asset library saved');
  } catch (error) {
    console.error('Error saving asset library:', error);
  }
}

// API Routes

// Upload and analyze PowerPoint file
app.post('/api/upload', upload.single('pptFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing uploaded file:', req.file.filename);

    // Create extract directories
    const extractDir = path.join(__dirname, '../extracted', path.basename(req.file.filename, path.extname(req.file.filename)));
    const imageDir = path.join(extractDir, 'images');

    // Ensure directories exist
    await fs.mkdir(extractDir, { recursive: true });
    await fs.mkdir(imageDir, { recursive: true });

    // Process PowerPoint file using Python script
    const pythonScript = path.join(__dirname, 'ppt_processor.py');
    const command = `python3 "${pythonScript}" "${req.file.path}" "${extractDir}" "${imageDir}"`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error('Python script error:', stderr);
    }

    const analysisResult = JSON.parse(stdout);

    if (!analysisResult.success) {
      throw new Error(analysisResult.error);
    }

    const metadata = analysisResult.metadata;
    const slidesInfo = analysisResult.slides;

    // Prepare response data
    const analysisData = {
      fileId: req.file.filename,
      filename: req.file.originalname,
      uploadPath: req.file.path,
      extractDir,
      metadata,
      slides: slidesInfo,
      totalSlides: metadata.slide_count,
      totalImages: metadata.total_images,
      uploadTime: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'File uploaded and analyzed successfully',
      data: analysisData
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process PowerPoint file',
      details: error.message
    });
  }
});

// Get extracted assets for selection
app.get('/api/extracted/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const extractDir = path.join(__dirname, '../extracted', path.basename(fileId, path.extname(fileId)));
    const imagesDir = path.join(extractDir, 'images');

    // Check if extraction directory exists
    try {
      await fs.access(extractDir);
    } catch {
      return res.status(404).json({ error: 'Extracted assets not found' });
    }

    // Read extracted images
    let imageFiles = [];
    try {
      const files = await fs.readdir(imagesDir);
      imageFiles = files.filter(file => /\.(png|jpg|jpeg|gif)$/i.test(file));
    } catch {
      console.log('No images directory found');
    }

    // Read analysis JSON if available
    let analysisData = null;
    try {
      const jsonFiles = await fs.readdir(extractDir);
      const analysisFile = jsonFiles.find(file => file.includes('_analysis') && file.endsWith('.json'));
      if (analysisFile) {
        const data = await fs.readFile(path.join(extractDir, analysisFile), 'utf8');
        analysisData = JSON.parse(data);
        console.log('Loaded analysis data from', analysisFile);
      }
    } catch {
      console.log('No analysis data found for', fileId);
    }

    res.json({
      success: true,
      extractDir: extractDir.replace(__dirname + '/../', ''),
      images: imageFiles.map(file => ({
        filename: file,
        url: `/extracted/${path.basename(fileId, path.extname(fileId))}/images/${file}`,
        slideNumber: file.match(/slide_(\d+)_/)?.[1] || 'unknown'
      })),
      analysisData
    });

  } catch (error) {
    console.error('Error getting extracted assets:', error);
    res.status(500).json({ error: 'Failed to get extracted assets' });
  }
});

// Save selected assets to library
app.post('/api/save-assets', async (req, res) => {
  try {
    const { fileId, selectedAssets } = req.body;

    if (!selectedAssets || selectedAssets.length === 0) {
      return res.status(400).json({ error: 'No assets selected' });
    }

    const extractDir = path.join(__dirname, '../extracted', path.basename(fileId, path.extname(fileId)));
    const savedAssets = [];

    for (const asset of selectedAssets) {
      const assetData = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: asset.name || asset.filename || 'Untitled Asset',
        type: asset.type || (asset.filename ? 'image' : 'textbox'),
        category: asset.category || 'uncategorized',
        tags: asset.tags || [],
        sourceFile: fileId,
        slideNumber: asset.slideNumber,
        dateAdded: new Date().toISOString()
      };

      if (asset.type === 'image' && asset.filename) {
        // Copy image to permanent location
        const sourcePath = path.join(extractDir, 'images', asset.filename);
        const destPath = path.join(__dirname, '../ppt-addin/web/assets', `${assetData.id}.png`);

        try {
          await fs.copyFile(sourcePath, destPath);
          assetData.url = `assets/${assetData.id}.png`;
          assetData.originalPath = asset.url;
        } catch (copyError) {
          console.error('Error copying asset:', copyError);
          continue; // Skip this asset if copy fails
        }
      } else if (asset.type === 'textbox') {
        assetData.content = asset.content;
      }

      assetLibrary.push(assetData);
      savedAssets.push(assetData);
    }

    // Save updated library
    await saveAssetLibrary();

    res.json({
      success: true,
      message: `Saved ${savedAssets.length} assets to library`,
      savedAssets
    });

  } catch (error) {
    console.error('Error saving assets:', error);
    res.status(500).json({ error: 'Failed to save assets' });
  }
});

// Get current asset library
app.get('/api/library', (req, res) => {
  res.json({
    success: true,
    assets: assetLibrary,
    count: assetLibrary.length
  });
});

// Delete asset from library
app.delete('/api/library/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const assetIndex = assetLibrary.findIndex(asset => asset.id === assetId);

    if (assetIndex === -1) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = assetLibrary[assetIndex];

    // Delete physical file if it exists
    if (asset.url) {
      const filePath = path.join(__dirname, '../ppt-addin/web', asset.url);
      try {
        await fs.unlink(filePath);
      } catch {
        console.log('Asset file not found or already deleted');
      }
    }

    // Remove from library
    assetLibrary.splice(assetIndex, 1);
    await saveAssetLibrary();

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Update asset metadata
app.put('/api/library/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const updates = req.body;

    const assetIndex = assetLibrary.findIndex(asset => asset.id === assetId);
    if (assetIndex === -1) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Update asset
    assetLibrary[assetIndex] = {
      ...assetLibrary[assetIndex],
      ...updates,
      lastModified: new Date().toISOString()
    };

    await saveAssetLibrary();

    res.json({
      success: true,
      message: 'Asset updated successfully',
      asset: assetLibrary[assetIndex]
    });

  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Get uploaded files
app.get('/api/uploads', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const files = await fs.readdir(uploadsDir);

    const fileData = await Promise.all(files.map(async (file) => {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);

      return {
        filename: file,
        originalName: file.replace(/_\d+\.(pptx?|ppt)$/, ''),
        size: stats.size,
        uploadDate: stats.mtime,
        url: `/uploads/${file}`
      };
    }));

    res.json({
      success: true,
      files: fileData.sort((a, b) => b.uploadDate - a.uploadDate)
    });

  } catch (error) {
    console.error('Error getting uploads:', error);
    res.status(500).json({ error: 'Failed to get uploaded files' });
  }
});

// Initialize and start server
async function startServer() {
  await loadAssetLibrary();

  app.listen(PORT, () => {
    console.log(`Asset Manager Server running at http://localhost:${PORT}`);
    console.log(`Upload PowerPoint files and manage your asset library!`);
  });
}

startServer().catch(console.error);
