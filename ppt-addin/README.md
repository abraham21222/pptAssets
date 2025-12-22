# Company Asset Library - PowerPoint Add-in

A working MVP PowerPoint add-in that lets you insert approved company assets directly from a sidebar.

## 🚀 Features Built

- **Asset Library**: 9 real assets extracted from your PowerPoint file
- **Smart Search**: Find assets by name or tags
- **Category Filters**: Logos, Charts, Legal/Compliance
- **One-Click Insert**: Images and text blocks inserted automatically
- **Compliance Tools**: Add footers, copyright, audit presentations
- **Professional UI**: Clean, Office-style sidebar interface

## 📦 What's Included

### Assets from Your PowerPoint:
- Company logo
- 4 different chart/graph templates
- Confidential footer
- Legal disclaimer
- Approval stamps
- Draft watermarks

### Compliance Features:
- Add confidential footer
- Insert copyright notice
- Audit presentations for compliance

## 🛠️ How to Run (2 minutes)

### Step 1: Install & Start
```bash
cd ppt-addin
npm install
npm start
```
The server runs at `http://localhost:3000`

### Step 2: Load into PowerPoint
1. Open PowerPoint
2. Go to **Insert → My Add-ins → Upload My Add-in**
3. Select the `manifest.xml` file
4. Click "Open Asset Library" button in the ribbon

### Step 3: Use It!
- Search for assets
- Click "Insert" on any item
- Use compliance tools at the bottom

## 🎯 What You Get

When you open the add-in sidebar in PowerPoint:

1. **Search Bar**: Type "logo", "chart", "confidential" etc.
2. **Filter Buttons**: All, Logos, Charts, Legal
3. **Asset Grid**: Thumbnails of all available assets
4. **Insert Buttons**: One-click insertion into current slide
5. **Compliance Tools**: Auto-add footers, copyright, audit slides

## 💡 How It Works

- **Office.js APIs**: Communicates with PowerPoint directly
- **Asset Storage**: Images stored locally, text blocks in JavaScript
- **Smart Positioning**: Assets placed automatically in good locations
- **Real-time**: No downloads, direct insertion into presentation

## 🚀 Next Steps

This MVP proves the concept works. To scale:

1. **Add Backend**: Store assets in database instead of hardcoded
2. **Add Authentication**: User login and permissions
3. **More Assets**: Upload new logos, templates, slides
4. **Advanced Insertion**: Better positioning, slide templates
5. **Deploy**: Host on cloud instead of localhost

## ✅ Ready to Demo

This add-in is **immediately usable** in PowerPoint. You can:
- Insert the exact assets from your original presentation
- Add compliance elements automatically
- Search and filter your asset library
- See how the UX feels inside PowerPoint

**Total build time: ~2 hours**