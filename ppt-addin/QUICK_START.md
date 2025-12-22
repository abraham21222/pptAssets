# 🚀 Quick Start - Get Your Add-in Running in PowerPoint

## 1. Start the Server (30 seconds)
```bash
cd ppt-addin
npm start
```
You'll see: `Server running at http://localhost:3000`

## 2. Load into PowerPoint (1 minute)

### Option A: Sideload (Easiest)
1. **Open PowerPoint** (any presentation)
2. Go to **Insert** tab → **My Add-ins** → **Upload My Add-in**
3. Navigate to `/ppt-addin/manifest.xml` and select it
4. Click **Upload**
5. Look for **"Open Asset Library"** button in the ribbon
6. Click it → Sidebar opens!

### Option B: Developer Mode (If Option A doesn't work)
1. Open PowerPoint
2. **File** → **Options** → **Trust Center** → **Trust Center Settings**
3. **Trusted Add-in Catalogs** → **Add new location**
4. Add the path to your `/ppt-addin/` folder
5. Check "Show in Menu"
6. Restart PowerPoint
7. **Insert** → **My Add-ins** → **Developer** tab
8. Find "Company Asset Library" and click **Add**

## 3. Use the Add-in (Instant)

Once the sidebar opens:

### Insert Assets:
- Type "logo" in search → Click "Insert"
- Filter by "Charts" → Insert any chart
- Try "confidential" search → Insert footer

### Compliance Tools:
- Click "Add Confidential Footer" (bottom of sidebar)
- Click "Add © Copyright Notice"
- Click "Audit Current Presentation"

## ✅ What Should Happen:

1. **Sidebar loads** with search bar and asset thumbnails
2. **Search works** - type to filter assets
3. **Insert works** - assets appear on your slide
4. **Compliance tools work** - footers/copyright get added

## 🎯 If Something's Wrong:

### "Add-in won't load"
- Check that `npm start` is running
- Try `http://localhost:3000/taskpane.html` in browser - should load the sidebar
- Make sure PowerPoint is closed when uploading manifest

### "Insert button doesn't work"
- Make sure you have a slide selected
- Check browser console (F12) for errors
- Try refreshing the add-in (close sidebar, reopen)

### "No assets showing"
- The assets are hardcoded in the HTML for this MVP
- Check that the asset images are in `/ppt-addin/assets/`

## 🎉 Success = You Have:

✅ Working sidebar inside PowerPoint
✅ Searchable asset library
✅ One-click asset insertion
✅ Compliance tools that actually work
✅ Real Office add-in running locally

**Time to working add-in: ~2 minutes**