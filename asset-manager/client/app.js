// Asset Manager Web App
class AssetManager {
    constructor() {
        const { origin } = window.location;
        this.apiBase = `${origin}/api`;
        this.selectedAssets = new Set();
        this.currentFileId = null;
        this.extractedAssets = [];
        this.slideSummaries = [];
        this.activeSlideFilter = null;
        this.activityLog = [];

        this.initializeEventListeners();
        this.loadLibrary();
        this.renderActivityLog();
        this.logActivity('Ready to extract PowerPoint assets.');
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

        this.logActivity(`Uploading ${file.name} (${Math.round(file.size / 1024)} KB)…`, 'info');

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

            const raw = await response.text();
            let result;
            try {
                result = raw ? JSON.parse(raw) : {};
            } catch (parseError) {
                console.error('Upload response parse error:', raw);
                throw new Error('Server returned an unexpected response');
            }

            if (!response.ok || !result.success) {
                const details = result?.details || result?.error || 'Upload failed';
                throw new Error(details);
            }

            this.currentFileId = result.data.fileId;
            this.showStatus(`✅ Analyzed ${result.data.totalSlides} slides, found ${result.data.totalImages} images`, 'success');
            this.logActivity(`Analysis complete: ${result.data.totalSlides} slides, ${result.data.totalImages} images detected.`, 'success');

            // Load extracted assets
            await this.loadExtractedAssets(this.currentFileId);

        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus(`❌ Failed to process file: ${error.message}`, 'error');
            this.logActivity(`Upload failed: ${error.message}`, 'error');
        } finally {
            this.showProgress(false);
        }
    }

    async loadExtractedAssets(fileId) {
        try {
            const response = await fetch(`${this.apiBase}/extracted/${fileId}`);
            const result = await response.json();

            if (result.success) {
                if (!result.analysisData || !result.analysisData.slides || !result.analysisData.slides.length) {
                    console.warn('[AssetManager] No analysis data returned; only images will be available.');
                } else {
                    console.log('[AssetManager] Loaded analysis data for', result.analysisData.slides.length, 'slides');
                }
                this.extractedAssets = this.prepareAssetsForSelection(result);
                this.slideSummaries = this.buildSlideSummaries(result, this.extractedAssets);
                this.activeSlideFilter = null;
                this.showAssetPreview();
                this.logActivity(`Prepared ${this.extractedAssets.length} selectable assets.`, 'success');
                console.log('[AssetManager] Slide summaries', this.slideSummaries);
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error loading extracted assets:', error);
            this.showStatus(`Error loading extracted assets: ${error.message}`, 'error');
            this.logActivity(`Failed to load extracted assets: ${error.message}`, 'error');
        }
    }

    buildSlideSummaries(result, assets = []) {
        if (result.analysisData && result.analysisData.slides && result.analysisData.slides.length) {
            return result.analysisData.slides.map(slide => ({
                slideNumber: slide.slide_number,
                title: slide.title || `Slide ${slide.slide_number}`,
                tags: slide.tags || [],
                textCount: slide.text_content ? slide.text_content.length : 0,
                imageCount: slide.image_count || 0
            })).sort((a, b) => a.slideNumber - b.slideNumber);
        }

        if (!assets.length) {
            return [];
        }

        const grouped = new Map();
        assets.forEach(asset => {
            const slide = asset.slideNumber || 0;
            if (!grouped.has(slide)) {
                grouped.set(slide, {
                    slideNumber: slide,
                    title: `Slide ${slide}`,
                    tags: [],
                    textCount: 0,
                    imageCount: 0
                });
            }
            const entry = grouped.get(slide);
            if (asset.type === 'image') {
                entry.imageCount += 1;
            } else {
                entry.textCount += 1;
            }
            if (asset.tags && asset.tags.length) {
                entry.tags.push(...asset.tags.slice(0, 2));
            }
            if (asset.name && entry.title === `Slide ${slide}`) {
                entry.title = asset.name;
            }
        });
        console.warn('[AssetManager] Building slide summaries from assets fallback. Grouped slides:', grouped.size);

        return Array.from(grouped.values()).sort((a, b) => a.slideNumber - b.slideNumber);
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
                preview: 'image'
            });
        });

        // Add comprehensive content from analysis
        if (result.analysisData && result.analysisData.slides) {
            result.analysisData.slides.forEach(slide => {

                // Add slide titles as potential assets
                if (slide.title && slide.title.trim()) {
                    assets.push({
                        id: `title_${slide.slide_number}`,
                        type: 'textbox',
                        name: `Slide ${slide.slide_number} Title`,
                        content: slide.title,
                        slideNumber: slide.slide_number,
                        category: 'titles',
                        preview: 'title',
                        description: `Title text from slide ${slide.slide_number}`
                    });
                }

                // Add slide notes if available
                if (slide.notes && slide.notes.trim()) {
                    assets.push({
                        id: `notes_${slide.slide_number}`,
                        type: 'textbox',
                        name: `Slide ${slide.slide_number} Notes`,
                        content: slide.notes,
                        slideNumber: slide.slide_number,
                        category: 'notes',
                        preview: 'notes',
                        description: `Speaker notes from slide ${slide.slide_number}`
                    });
                }

                // Add ALL text content with smart categorization
                 (slide.text_content || []).forEach((text, index) => {
                    if (!text || text.trim().length < 3) return; // Skip empty/tiny text

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

                // Add slide-level summary asset
                const totalTextItems = slide.text_content ? slide.text_content.length : 0;
                const totalImages = slide.image_count;
                if (totalTextItems > 0 || totalImages > 0) {
                    assets.push({
                        id: `slide_${slide.slide_number}`,
                        type: 'slide-summary',
                        name: `Slide ${slide.slide_number} Overview`,
                        content: `Slide ${slide.slide_number}${slide.title ? ': ' + slide.title : ''}`,
                        slideNumber: slide.slide_number,
                        category: 'slides',
                        preview: 'slide',
                        description: `Complete slide with ${totalTextItems} text items, ${totalImages} images`,
                        metadata: {
                            textItems: totalTextItems,
                            imageCount: totalImages,
                            tags: slide.tags || []
                        }
                    });
                }
            });
        }

        // Sort by slide number and type for better organization
        return assets.sort((a, b) => {
            if (a.slideNumber !== b.slideNumber) {
                return a.slideNumber - b.slideNumber;
            }
            // Within same slide, prioritize: titles, images, text, notes
            const typeOrder = { 'slide-summary': 0, 'image': 1, 'textbox': 2 };
            return (typeOrder[a.type] || 3) - (typeOrder[b.type] || 3);
        });
    }

    showAssetPreview() {
        const previewDiv = document.getElementById('assetPreview');
        const gridDiv = document.getElementById('assetGrid');
        const emptyState = document.getElementById('assetEmptyState');

        // Clear existing assets
        gridDiv.innerHTML = '';
        this.selectedAssets.clear();

        this.renderSlideNavigator();
        this.renderAssetGrid();

        // Show preview section
        previewDiv.style.display = 'flex';
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        const scrollRegion = document.querySelector('.asset-scroll');
        if (scrollRegion) {
            scrollRegion.scrollTop = 0;
        }
        this.updateSelectionCount();
    }

    createAssetElement(asset) {
        const div = document.createElement('div');
        div.className = `asset-item asset-${asset.preview || asset.type}`;
        div.dataset.assetId = asset.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checkbox';
        checkbox.addEventListener('change', () => this.toggleAssetSelection(asset.id));
        checkbox.checked = this.selectedAssets.has(asset.id);
        if (checkbox.checked) {
            div.classList.add('selected');
        }

        const preview = document.createElement('div');
        preview.className = 'asset-card-preview';

        // Create different previews based on content type
        if (asset.type === 'image') {
            preview.innerHTML = `<img src="${asset.url}" class="asset-image" alt="${asset.name}">`;
        } else if (asset.type === 'slide-summary') {
            preview.className += ' slide-summary-preview';
            preview.innerHTML = `
                <div class="slide-icon">📄</div>
                <div class="slide-stats">
                    <div>${asset.metadata.textItems} text items</div>
                    <div>${asset.metadata.imageCount} images</div>
                </div>
            `;
        } else {
            // Text content with different styling based on category
            preview.className += ` text-preview ${asset.preview}-preview`;

            let icon = '📝';
            let bgColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

            switch(asset.preview) {
                case 'title':
                    icon = '📊';
                    bgColor = 'linear-gradient(135deg, #0078d7 0%, #106ebe 100%)';
                    break;
                case 'confidential':
                    icon = '🔒';
                    bgColor = 'linear-gradient(135deg, #d83b01 0%, #c13200 100%)';
                    break;
                case 'copyright':
                    icon = '©️';
                    bgColor = 'linear-gradient(135deg, #107c10 0%, #0e6e0e 100%)';
                    break;
                case 'agenda':
                    icon = '📋';
                    bgColor = 'linear-gradient(135deg, #5c2d91 0%, #4c1a71 100%)';
                    break;
                case 'conclusion':
                    icon = '✅';
                    bgColor = 'linear-gradient(135deg, #008272 0%, #006b5c 100%)';
                    break;
                case 'header':
                    icon = '🏷️';
                    bgColor = 'linear-gradient(135deg, #ca5010 0%, #b4440e 100%)';
                    break;
                case 'paragraph':
                    icon = '📄';
                    bgColor = 'linear-gradient(135deg, #744da9 0%, #5a3783 100%)';
                    break;
                case 'notes':
                    icon = '📝';
                    bgColor = 'linear-gradient(135deg, #8764b8 0%, #6b4c91 100%)';
                    break;
            }

            const displayText = asset.content.length > 60
                ? asset.content.substring(0, 60) + '...'
                : asset.content;

            preview.innerHTML = `
                <div class="text-preview-content" style="background: ${bgColor};">
                    <div class="text-icon">${icon}</div>
                    <div class="text-sample">${displayText}</div>
                </div>
            `;
        }

        const nameDiv = document.createElement('div');
        nameDiv.className = 'asset-name';
        nameDiv.textContent = asset.name;

        const descDiv = document.createElement('div');
        descDiv.className = 'asset-description';
        descDiv.textContent = asset.description || `From slide ${asset.slideNumber}`;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'asset-info';

        let infoText = `Slide ${asset.slideNumber} • ${asset.category}`;
        if (asset.wordCount) {
            infoText += ` • ${asset.wordCount} words`;
        }
        infoDiv.textContent = infoText;

        // Add category badge
        const categoryBadge = document.createElement('div');
        categoryBadge.className = `category-badge category-${asset.category}`;
        categoryBadge.textContent = asset.category;

        div.appendChild(checkbox);
        div.appendChild(preview);
        div.appendChild(nameDiv);
        div.appendChild(descDiv);
        div.appendChild(infoDiv);
        div.appendChild(categoryBadge);

        // Click to toggle selection
        div.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                this.toggleAssetSelection(asset.id);
            }
        });

        return div;
    }

    renderAssetGrid() {
        const gridDiv = document.getElementById('assetGrid');
        if (!gridDiv) return;

        gridDiv.innerHTML = '';
        const assetsToRender = this.extractedAssets.filter(asset => {
            if (!this.activeSlideFilter || this.activeSlideFilter === 'all') {
                return true;
            }
            return asset.slideNumber === this.activeSlideFilter;
        });

        if (assetsToRender.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'asset-empty';
            empty.textContent = 'No assets match this filter yet.';
            gridDiv.appendChild(empty);
            return;
        }

        assetsToRender.forEach(asset => {
            const assetElement = this.createAssetElement(asset);
            gridDiv.appendChild(assetElement);
        });
    }

    renderSlideNavigator() {
        const container = document.getElementById('slideNavigator');
        const allButton = document.getElementById('allSlidesBtn');
        if (!container) return;

        container.innerHTML = '';
        if (allButton) {
            if (!this.activeSlideFilter || this.activeSlideFilter === 'all') {
                allButton.classList.add('active');
            } else {
                allButton.classList.remove('active');
            }
        }

        if (!this.slideSummaries.length) {
            const placeholder = document.createElement('p');
            placeholder.className = 'muted';
            placeholder.textContent = 'Upload a deck to see per-slide context.';
            container.appendChild(placeholder);
            return;
        }

        this.slideSummaries.forEach(summary => {
            const card = document.createElement('div');
            card.className = 'slide-card';
            if (this.activeSlideFilter === summary.slideNumber) {
                card.classList.add('active');
            }

            const title = document.createElement('h4');
            title.textContent = `Slide ${summary.slideNumber}`;

            const subtitle = document.createElement('div');
            subtitle.className = 'muted';
            subtitle.textContent = summary.title;

            const meta = document.createElement('div');
            meta.className = 'slide-meta';
            meta.innerHTML = `<span>📝 ${summary.textCount}</span><span>🖼️ ${summary.imageCount}</span>`;

            const tags = document.createElement('div');
            tags.className = 'slide-tags';
            summary.tags.slice(0, 3).forEach(tag => {
                const pill = document.createElement('span');
                pill.className = 'tag';
                pill.textContent = tag;
                tags.appendChild(pill);
            });

            card.appendChild(title);
            card.appendChild(subtitle);
            card.appendChild(meta);
            if (summary.tags.length) {
                card.appendChild(tags);
            }

            card.addEventListener('click', () => this.setSlideFilter(summary.slideNumber));
            container.appendChild(card);
        });
    }

    setSlideFilter(slideNumber) {
        if (slideNumber === 'all') {
            this.activeSlideFilter = null;
        } else if (this.activeSlideFilter === slideNumber) {
            this.activeSlideFilter = null;
        } else {
            this.activeSlideFilter = slideNumber;
        }

        this.renderSlideNavigator();
        this.renderAssetGrid();
        this.updateSelectionCount();

        const label = this.activeSlideFilter ? `Slide ${this.activeSlideFilter}` : 'all slides';
        this.logActivity(`Filtering assets for ${label}.`, 'info');
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
            this.logActivity('Attempted to save without selecting assets.', 'error');
            return;
        }

        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        saveBtn.innerHTML = '<div class="loading"></div> Saving...';

        try {
            // Prepare selected assets data
            const selectedAssetsData = this.extractedAssets
                .filter(asset => this.selectedAssets.has(asset.id))
                .map(asset => ({
                    ...asset,
                    // Add additional metadata
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
                this.logActivity(`Saved ${result.savedAssets.length} assets to the library.`, 'success');
                this.cancelPreview();
                this.loadLibrary(); // Refresh library
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Save error:', error);
            this.showStatus(`❌ Failed to save assets: ${error.message}`, 'error');
            this.logActivity(`Saving assets failed: ${error.message}`, 'error');
        } finally {
            saveBtn.textContent = originalText;
        }
    }

    getAssetName(asset) {
        if (asset.type === 'image') {
            // Try to generate meaningful names for images
            if (asset.filename.includes('logo')) return 'Company Logo';
            if (asset.filename.includes('chart')) return 'Chart Template';
            return `Image from Slide ${asset.slideNumber}`;
        } else {
            // For text, use the first few words
            const words = asset.content.split(' ').slice(0, 4).join(' ');
            return words.length > 30 ? words.substring(0, 30) + '...' : words;
        }
    }

    getAssetCategory(asset) {
        if (asset.type === 'image') {
            if (asset.filename.includes('logo')) return 'logos';
            if (asset.filename.includes('chart') || asset.filename.includes('graph')) return 'charts';
            return 'images';
        } else {
            const content = asset.content.toLowerCase();
            if (content.includes('confidential') || content.includes('copyright') || content.includes('©')) {
                return 'compliance';
            }
            if (content.includes('title') || asset.name.includes('Title')) {
                return 'titles';
            }
            return 'text';
        }
    }

    getAssetTags(asset) {
        const tags = [];
        const content = (asset.content || '').toLowerCase();

        if (content.includes('confidential')) tags.push('confidential');
        if (content.includes('copyright') || content.includes('©')) tags.push('copyright');
        if (content.includes('logo')) tags.push('branding');
        if (content.includes('chart') || content.includes('graph')) tags.push('analytics');

        tags.push('approved'); // All manually selected assets are considered approved

        return tags;
    }

    async loadLibrary() {
        try {
            const response = await fetch(`${this.apiBase}/library`);
            const result = await response.json();

            if (result.success) {
                this.displayLibrary(result.assets);
                document.getElementById('libraryCount').textContent = `${result.count} assets in library`;
                this.showStatus(`Library updated with ${result.count} assets`, 'success');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Error loading library:', error);
            document.getElementById('libraryCount').textContent = 'Error loading library';
            this.logActivity(`Failed to load library: ${error.message}`, 'error');
        }
    }

    displayLibrary(assets) {
        const gridDiv = document.getElementById('libraryGrid');
        gridDiv.innerHTML = '';

        if (assets.length === 0) {
            gridDiv.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">No assets in library yet. Upload a PowerPoint file to get started!</div>';
            return;
        }

        assets.forEach(asset => {
            const element = this.createLibraryElement(asset);
            gridDiv.appendChild(element);
        });
    }

    createLibraryElement(asset) {
        const div = document.createElement('div');
        div.className = 'library-item';

        const preview = document.createElement('div');
        preview.className = 'library-preview';

        if (asset.type === 'image' && asset.url) {
            preview.innerHTML = `<img src="http://localhost:8080/${asset.url}" alt="${asset.name}">`;
        } else {
            preview.innerHTML = `<div style="text-align: center; color: #666; font-size: 12px;">${asset.content ? asset.content.substring(0, 100) : 'Text Asset'}</div>`;
        }

        const nameDiv = document.createElement('div');
        nameDiv.className = 'library-name';
        nameDiv.textContent = asset.name;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'library-meta';
        metaDiv.innerHTML = `
            <div>Category: ${asset.category}</div>
            <div>From: ${asset.sourceFile || 'Unknown'}</div>
            <div>Added: ${new Date(asset.dateAdded).toLocaleDateString()}</div>
        `;

        const tagsDiv = document.createElement('div');
        if (asset.tags && asset.tags.length > 0) {
            asset.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = `tag ${tag}`;
                tagSpan.textContent = tag;
                tagsDiv.appendChild(tagSpan);
            });
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'library-actions';
        actionsDiv.innerHTML = `
            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 12px;" onclick="assetManager.editAsset('${asset.id}')">Edit</button>
            <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="assetManager.deleteAsset('${asset.id}')">Delete</button>
        `;

        div.appendChild(preview);
        div.appendChild(nameDiv);
        div.appendChild(metaDiv);
        div.appendChild(tagsDiv);
        div.appendChild(actionsDiv);

        return div;
    }

    async deleteAsset(assetId) {
        if (!confirm('Are you sure you want to delete this asset?')) return;

        try {
            const response = await fetch(`${this.apiBase}/library/${assetId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus('✅ Asset deleted successfully', 'success');
                this.loadLibrary(); // Refresh library
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Delete error:', error);
            this.showStatus(`❌ Failed to delete asset: ${error.message}`, 'error');
        }
    }

    editAsset(assetId) {
        // Simple edit - just rename for now
        const newName = prompt('Enter new name for this asset:');
        if (!newName) return;

        this.updateAsset(assetId, { name: newName.trim() });
    }

    async updateAsset(assetId, updates) {
        try {
            const response = await fetch(`${this.apiBase}/library/${assetId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus('✅ Asset updated successfully', 'success');
                this.loadLibrary(); // Refresh library
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Update error:', error);
            this.showStatus(`❌ Failed to update asset: ${error.message}`, 'error');
        }
    }

    // Utility functions
    showProgress(show) {
        const progressBar = document.getElementById('progressBar');
        progressBar.classList.toggle('hidden', !show);

        if (show) {
            // Simulate progress for better UX
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

        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status-message';
        }, 5000);
    }

    cancelPreview() {
        const preview = document.getElementById('assetPreview');
        const emptyState = document.getElementById('assetEmptyState');
        const gridDiv = document.getElementById('assetGrid');

        preview.style.display = 'none';
        if (gridDiv) {
            gridDiv.innerHTML = '';
        }
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        this.selectedAssets.clear();
        this.currentFileId = null;
        this.logActivity('Cleared current extraction batch.', 'info');
    }

    refreshLibrary() {
        this.loadLibrary();
        this.showStatus('🔄 Library refreshed', 'info');
        this.logActivity('Library refreshed.', 'info');
    }

    logActivity(message, type = 'info') {
        const entry = {
            message,
            type,
            time: new Date()
        };
        this.activityLog.unshift(entry);
        if (this.activityLog.length > 50) {
            this.activityLog.pop();
        }
        this.renderActivityLog();
    }

    renderActivityLog() {
        const container = document.getElementById('activityEntries');
        if (!container) return;

        container.innerHTML = '';
        if (this.activityLog.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'log-entry info';
            empty.innerHTML = '<span class="log-time">--:--:--</span><span>No activity yet.</span>';
            container.appendChild(empty);
            return;
        }

        this.activityLog.forEach(entry => {
            const div = document.createElement('div');
            div.className = `log-entry ${entry.type}`;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'log-time';
            timeSpan.textContent = entry.time.toLocaleTimeString();

            const messageSpan = document.createElement('span');
            messageSpan.textContent = entry.message;

            div.appendChild(timeSpan);
            div.appendChild(messageSpan);
            container.appendChild(div);
        });
    }

    clearActivityLog() {
        this.activityLog = [];
        this.renderActivityLog();
        this.logActivity('Activity log cleared.', 'info');
    }
}

// Global functions for UI
function selectAll() {
    const checkboxes = document.querySelectorAll('.asset-item .checkbox');
    checkboxes.forEach(cb => {
        if (!cb.checked) {
            cb.checked = true;
            const assetId = cb.closest('.asset-item').dataset.assetId;
            assetManager.selectedAssets.add(assetId);
            cb.closest('.asset-item').classList.add('selected');
        }
    });
    assetManager.updateSelectionCount();
}

function selectNone() {
    const checkboxes = document.querySelectorAll('.asset-item .checkbox');
    checkboxes.forEach(cb => {
        cb.checked = false;
        const assetId = cb.closest('.asset-item').dataset.assetId;
        assetManager.selectedAssets.delete(assetId);
        cb.closest('.asset-item').classList.remove('selected');
    });
    assetManager.updateSelectionCount();
}

function saveSelectedAssets() {
    assetManager.saveSelectedAssets();
}

function cancelPreview() {
    assetManager.cancelPreview();
}

function refreshLibrary() {
    assetManager.refreshLibrary();
}

function selectByType(category) {
    const assetItems = document.querySelectorAll('.asset-item');
    let selectedCount = 0;

    assetItems.forEach(item => {
        const assetId = item.dataset.assetId;
        const asset = assetManager.extractedAssets.find(a => a.id === assetId);

        if (asset && asset.category === category) {
            const checkbox = item.querySelector('.checkbox');
            if (!checkbox.checked) {
                checkbox.checked = true;
                assetManager.selectedAssets.add(assetId);
                item.classList.add('selected');
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

function filterBySlide(slideNumber) {
    const parsed = slideNumber === 'all' ? 'all' : Number(slideNumber);
    assetManager.setSlideFilter(parsed);
}

function clearActivityLog() {
    assetManager.clearActivityLog();
}

// Initialize app when page loads
let assetManager;
document.addEventListener('DOMContentLoaded', () => {
    assetManager = new AssetManager();
});
