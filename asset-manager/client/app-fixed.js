// Enhanced Asset Manager with Better UI
class AssetManager {
    constructor() {
        this.apiBase = 'http://localhost:3001/api';
        this.selectedAssets = new Set();
        this.currentFileId = null;
        this.extractedAssets = [];

        this.initializeEventListeners();
        this.loadLibrary();
    }

    initializeEventListeners() {
        // File input
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', this.handleFileUpload.bind(this));

        // Drag and drop
        const uploadArea = document.querySelector('.upload-area');
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        // Validate file type
        const validTypes = ['.ppt', '.pptx'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(fileExt)) {
            this.showStatus('Please select a PowerPoint file (.ppt or .pptx)', 'error');
            return;
        }

        // Show progress
        this.showProgress(true);
        this.showStatus('Uploading and analyzing PowerPoint file...', 'info');

        try {
            const formData = new FormData();
            formData.append('pptFile', file);

            const response = await fetch(`${this.apiBase}/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.currentFileId = result.data.fileId;
                this.showStatus(`✅ Analyzed ${result.data.totalSlides} slides, found ${result.data.totalImages} images`, 'success');

                // Load extracted assets
                await this.loadExtractedAssets(this.currentFileId);
            } else {
                throw new Error(result.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus(`❌ Failed to process file: ${error.message}`, 'error');
        } finally {
            this.showProgress(false);
        }
    }

    async loadExtractedAssets(fileId) {
        try {
            const response = await fetch(`${this.apiBase}/extracted/${fileId}`);
            const result = await response.json();

            if (result.success) {
                this.extractedAssets = this.prepareAssetsForSelection(result);
                this.showAssetViewer();
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error loading extracted assets:', error);
            this.showStatus(`Error loading extracted assets: ${error.message}`, 'error');
        }
    }

    prepareAssetsForSelection(result) {
        const assets = [];

        // Add images
        result.images.forEach(image => {
            assets.push({
                id: `img_${image.filename}`,
                type: 'image',
                name: `Image from Slide ${image.slideNumber}`,
                filename: image.filename,
                url: image.url,
                slideNumber: image.slideNumber,
                category: 'images',
                preview: 'image',
                description: `Image extracted from slide ${image.slideNumber}`
            });
        });

        // Add comprehensive content from analysis
        if (result.analysisData && result.analysisData.slides) {
            result.analysisData.slides.forEach(slide => {

                // Add slide titles
                if (slide.title && slide.title.trim()) {
                    assets.push({
                        id: `title_${slide.slide_number}`,
                        type: 'textbox',
                        name: `Slide ${slide.slide_number} Title`,
                        content: slide.title,
                        slideNumber: slide.slide_number,
                        category: 'titles',
                        preview: 'title',
                        description: `Title text from slide ${slide.slide_number}`,
                        wordCount: slide.title.split(' ').length
                    });
                }

                // Add slide notes
                if (slide.notes && slide.notes.trim()) {
                    assets.push({
                        id: `notes_${slide.slide_number}`,
                        type: 'textbox',
                        name: `Slide ${slide.slide_number} Notes`,
                        content: slide.notes,
                        slideNumber: slide.slide_number,
                        category: 'notes',
                        preview: 'notes',
                        description: `Speaker notes from slide ${slide.slide_number}`,
                        wordCount: slide.notes.split(' ').length
                    });
                }

                // Add logos and brand elements (NEW!)
                if (slide.logos_and_brands && slide.logos_and_brands.length > 0) {
                    slide.logos_and_brands.forEach((logo, index) => {
                        const logoId = `logo_${slide.slide_number}_${index}`;

                        if (logo.type === 'text_logo') {
                            assets.push({
                                id: logoId,
                                type: 'logo_text',
                                name: 'Brand/Logo Text',
                                content: logo.content,
                                slideNumber: slide.slide_number,
                                category: 'branding',
                                preview: 'brand',
                                description: `Brand text: "${logo.content.substring(0, 30)}..."`,
                                fontInfo: logo.font_info || {}
                            });
                        } else if (logo.type === 'image_logo') {
                            assets.push({
                                id: logoId,
                                type: 'logo_image',
                                name: 'Brand/Logo Image',
                                content: `/images/${logo.file}`,
                                slideNumber: slide.slide_number,
                                category: 'branding',
                                preview: 'brand',
                                description: `Brand image from slide ${slide.slide_number}`
                            });
                        }
                    });
                }

                // Add formatted text shapes (NEW!)
                if (slide.text_shapes && slide.text_shapes.length > 0) {
                    slide.text_shapes.forEach((textShape, index) => {
                        assets.push({
                            id: `textshape_${slide.slide_number}_${index}`,
                            type: 'formatted_text',
                            name: 'Formatted Text Element',
                            content: textShape.text,
                            slideNumber: slide.slide_number,
                            category: 'design',
                            preview: 'formatted',
                            description: `Formatted: "${textShape.text.substring(0, 30)}..."`,
                            fontInfo: textShape.font_info || {}
                        });
                    });
                }

                // Add graphic elements (NEW!)
                if (slide.graphic_elements && slide.graphic_elements.length > 0) {
                    slide.graphic_elements.forEach((element, index) => {
                        assets.push({
                            id: `graphic_${slide.slide_number}_${index}`,
                            type: 'graphic',
                            name: 'Graphic Element',
                            content: element.text || 'Graphic shape/drawing',
                            slideNumber: slide.slide_number,
                            category: 'graphics',
                            preview: 'graphic',
                            description: element.text ? `Shape with text: "${element.text.substring(0, 30)}..."` : 'Graphic shape or drawing',
                            shapeType: element.shape_type || 'unknown'
                        });
                    });
                }

                // Add ALL text content with smart categorization
                slide.text_content.forEach((text, index) => {
                    if (!text || text.trim().length < 5) return; // Skip very short text

                    const textLower = text.toLowerCase();
                    let category = 'text';
                    let preview = 'text';
                    let name = `Text from Slide ${slide.slide_number}`;

                    // Smart categorization
                    if (textLower.includes('confidential') || textLower.includes('internal use') || textLower.includes('proprietary')) {
                        category = 'compliance';
                        preview = 'confidential';
                        name = `Confidential Notice`;
                    } else if (textLower.includes('copyright') || textLower.includes('©') || textLower.includes('all rights reserved')) {
                        category = 'compliance';
                        preview = 'copyright';
                        name = `Copyright Notice`;
                    } else if (textLower.includes('agenda') || textLower.includes('outline') || textLower.includes('overview')) {
                        category = 'structure';
                        preview = 'agenda';
                        name = `Agenda/Outline`;
                    } else if (textLower.includes('thank you') || textLower.includes('questions') || textLower.includes('contact')) {
                        category = 'conclusion';
                        preview = 'conclusion';
                        name = `Conclusion/Contact`;
                    } else if (text.length < 50) {
                        category = 'headers';
                        preview = 'header';
                        name = `Header/Short Text`;
                    } else if (text.length > 200) {
                        category = 'content';
                        preview = 'paragraph';
                        name = `Content Block`;
                    }

                    assets.push({
                        id: `text_${slide.slide_number}_${index}`,
                        type: 'textbox',
                        name: name,
                        content: text,
                        slideNumber: slide.slide_number,
                        category: category,
                        preview: preview,
                        description: `${text.length} characters from slide ${slide.slide_number}`,
                        wordCount: text.split(' ').length
                    });
                });
            });
        }

        // Sort by slide number and type for better organization
        return assets.sort((a, b) => {
            if (a.slideNumber !== b.slideNumber) {
                return a.slideNumber - b.slideNumber;
            }
            const typeOrder = { 'image': 1, 'textbox': 2 };
            return (typeOrder[a.type] || 3) - (typeOrder[b.type] || 3);
        });
    }

    showAssetViewer() {
        // Hide default state
        document.getElementById('defaultState').classList.add('hidden');

        // Show asset viewer
        const viewer = document.getElementById('assetViewer');
        viewer.style.display = 'flex';

        // Clear existing assets
        const assetList = document.getElementById('assetList');
        assetList.innerHTML = '';
        this.selectedAssets.clear();

        // Populate assets
        this.extractedAssets.forEach(asset => {
            const assetElement = this.createLargeAssetCard(asset);
            assetList.appendChild(assetElement);
        });

        this.updateSelectionCount();
    }

    createLargeAssetCard(asset) {
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.dataset.assetId = asset.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.addEventListener('change', () => this.toggleAssetSelection(asset.id));

        // Create preview section
        const preview = document.createElement('div');
        preview.className = 'asset-preview-large';

        if (asset.type === 'image') {
            preview.innerHTML = `<img src="${asset.url}" alt="${asset.name}">`;
        } else {
            // Text content with different styling based on category
            preview.className = 'asset-preview-large';

            let icon = '📝';
            let bgClass = 'preview-text';

            switch(asset.preview) {
                case 'title':
                    icon = '📊';
                    bgClass = 'preview-title';
                    break;
                case 'confidential':
                    icon = '🔒';
                    bgClass = 'preview-confidential';
                    break;
                case 'copyright':
                    icon = '©️';
                    bgClass = 'preview-copyright';
                    break;
                case 'agenda':
                    icon = '📋';
                    bgClass = 'preview-agenda';
                    break;
                case 'conclusion':
                    icon = '✅';
                    bgClass = 'preview-conclusion';
                    break;
                case 'header':
                    icon = '🏷️';
                    bgClass = 'preview-header';
                    break;
                case 'paragraph':
                    icon = '📄';
                    bgClass = 'preview-paragraph';
                    break;
                case 'notes':
                    icon = '📝';
                    bgClass = 'preview-notes';
                    break;
            }

            const displayText = asset.content.length > 200
                ? asset.content.substring(0, 200) + '...'
                : asset.content;

            preview.innerHTML = `
                <div class="text-preview-large ${bgClass}">
                    <div class="text-icon-large">${icon}</div>
                    <div class="text-sample-large">${displayText}</div>
                </div>
            `;
        }

        // Create info section
        const info = document.createElement('div');
        info.className = 'asset-info-large';

        const name = document.createElement('div');
        name.className = 'asset-name-large';
        name.textContent = asset.name;

        const description = document.createElement('div');
        description.className = 'asset-description-large';
        description.textContent = asset.description || `From slide ${asset.slideNumber}`;

        const meta = document.createElement('div');
        meta.className = 'asset-meta-large';
        let metaText = `Slide ${asset.slideNumber} • ${asset.category}`;
        if (asset.wordCount) {
            metaText += ` • ${asset.wordCount} words`;
        }
        meta.innerHTML = metaText;

        const badge = document.createElement('span');
        badge.className = `category-badge-large category-${asset.category}`;
        badge.textContent = asset.category;

        info.appendChild(name);
        info.appendChild(description);
        info.appendChild(meta);
        info.appendChild(badge);

        // Assemble card
        card.appendChild(checkbox);
        card.appendChild(preview);
        card.appendChild(info);

        // Click to toggle selection
        card.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                this.toggleAssetSelection(asset.id);
            }
        });

        return card;
    }

    toggleAssetSelection(assetId) {
        const element = document.querySelector(`[data-asset-id="${assetId}"]`);
        const checkbox = element.querySelector('.checkbox');

        if (checkbox.checked) {
            this.selectedAssets.add(assetId);
            element.classList.add('selected');
        } else {
            this.selectedAssets.delete(assetId);
            element.classList.remove('selected');
        }

        this.updateSelectionCount();
    }

    updateSelectionCount() {
        const countElement = document.getElementById('selectionCount');
        countElement.textContent = `${this.selectedAssets.size} selected`;
    }

    async saveSelectedAssets() {
        if (this.selectedAssets.size === 0) {
            this.showStatus('Please select at least one asset to save', 'error');
            return;
        }

        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        saveBtn.innerHTML = '<div class="loading"></div> Saving...';

        try {
            const selectedAssetsData = this.extractedAssets
                .filter(asset => this.selectedAssets.has(asset.id))
                .map(asset => ({
                    ...asset,
                    name: this.getAssetName(asset),
                    category: this.getAssetCategory(asset),
                    tags: this.getAssetTags(asset)
                }));

            const response = await fetch(`${this.apiBase}/save-assets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileId: this.currentFileId,
                    selectedAssets: selectedAssetsData
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus(`✅ Successfully saved ${result.savedAssets.length} assets to library!`, 'success');
                this.cancelAssetViewer();
                this.loadLibrary();
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Save error:', error);
            this.showStatus(`❌ Failed to save assets: ${error.message}`, 'error');
        } finally {
            saveBtn.textContent = originalText;
        }
    }

    getAssetName(asset) {
        if (asset.type === 'image') {
            if (asset.filename.includes('logo')) return 'Company Logo';
            if (asset.filename.includes('chart')) return 'Chart Template';
            return `Image from Slide ${asset.slideNumber}`;
        } else {
            const words = asset.content.split(' ').slice(0, 4).join(' ');
            return words.length > 30 ? words.substring(0, 30) + '...' : words;
        }
    }

    getAssetCategory(asset) {
        if (asset.type === 'image') {
            if (asset.filename.includes('logo')) return 'logos';
            if (asset.filename.includes('chart') || asset.filename.includes('graph')) return 'charts';
            return 'images';
        }
        return asset.category || 'text';
    }

    getAssetTags(asset) {
        const tags = [];
        const content = (asset.content || '').toLowerCase();

        if (content.includes('confidential')) tags.push('confidential');
        if (content.includes('copyright') || content.includes('©')) tags.push('copyright');
        if (content.includes('logo')) tags.push('branding');
        if (content.includes('chart') || content.includes('graph')) tags.push('analytics');

        tags.push('approved');
        return tags;
    }

    async loadLibrary() {
        try {
            const response = await fetch(`${this.apiBase}/library`);
            const result = await response.json();

            if (result.success) {
                document.getElementById('libraryStats').innerHTML = `
                    📊 ${result.count} assets in library
                    <br><small>Ready for use in PowerPoint add-in</small>
                `;
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error loading library:', error);
            document.getElementById('libraryStats').textContent = 'Error loading library';
        }
    }

    cancelAssetViewer() {
        document.getElementById('assetViewer').style.display = 'none';
        document.getElementById('defaultState').classList.remove('hidden');
        this.selectedAssets.clear();
        this.currentFileId = null;
    }

    showProgress(show) {
        const progressBar = document.getElementById('progressBar');
        progressBar.classList.toggle('hidden', !show);

        if (show) {
            const fill = document.getElementById('progressFill');
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                fill.style.width = `${progress}%`;
                if (progress >= 90) clearInterval(interval);
            }, 200);
        }
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.textContent = message;
        statusDiv.className = `status-message status-${type}`;

        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status-message';
        }, 5000);
    }

    refreshLibrary() {
        this.loadLibrary();
        this.showStatus('🔄 Library refreshed', 'info');
    }
}

// Global functions for UI
function selectAll() {
    const checkboxes = document.querySelectorAll('.asset-card .checkbox');
    checkboxes.forEach(cb => {
        if (!cb.checked) {
            cb.checked = true;
            const assetId = cb.closest('.asset-card').dataset.assetId;
            assetManager.selectedAssets.add(assetId);
            cb.closest('.asset-card').classList.add('selected');
        }
    });
    assetManager.updateSelectionCount();
}

function selectNone() {
    const checkboxes = document.querySelectorAll('.asset-card .checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
        const assetId = cb.closest('.asset-card').dataset.assetId;
        assetManager.selectedAssets.delete(assetId);
        cb.closest('.asset-card').classList.remove('selected');
    });
    assetManager.updateSelectionCount();
}

function selectByType(category) {
    const assetCards = document.querySelectorAll('.asset-card');
    let selectedCount = 0;

    assetCards.forEach(card => {
        const assetId = card.dataset.assetId;
        const asset = assetManager.extractedAssets.find(a => a.id === assetId);

        if (asset && asset.category === category) {
            const checkbox = card.querySelector('.checkbox');
            if (!checkbox.checked) {
                checkbox.checked = true;
                assetManager.selectedAssets.add(assetId);
                card.classList.add('selected');
                selectedCount++;
            }
        }
    });

    assetManager.updateSelectionCount();

    if (selectedCount > 0) {
        assetManager.showStatus(`Selected ${selectedCount} ${category} assets`, 'success');
    } else {
        assetManager.showStatus(`No ${category} assets found`, 'info');
    }
}

function saveSelectedAssets() {
    assetManager.saveSelectedAssets();
}

function cancelAssetViewer() {
    assetManager.cancelAssetViewer();
}

function refreshLibrary() {
    assetManager.refreshLibrary();
}

// Initialize app when page loads
let assetManager;
document.addEventListener('DOMContentLoaded', () => {
    assetManager = new AssetManager();
});