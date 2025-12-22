# 🔧 Microsoft 365 Admin Center: Step-by-Step Guide

## ❌ **You're in the Wrong Place!**
The screenshot shows PowerPoint application settings - that's NOT where you deploy add-ins for your organization.

## ✅ **Go to the Microsoft 365 Admin Center Instead**

### **Step 1: Check if You Have Admin Access**

**Method A: Direct URL**
1. Open your web browser
2. Go to: **https://admin.microsoft.com**
3. Sign in with your work/school account

**Method B: From Office 365**
1. Go to: **https://office.com**
2. Sign in with your work account
3. Look for **Admin** app tile (if you see it, you have access)

### **Step 2: Navigate to Integrated Apps**

Once you're in admin.microsoft.com:

1. **Left sidebar** → **Settings**
2. **Settings** → **Integrated apps**
3. **Click "Upload custom apps"**

### **Step 3: Upload Your Add-in**

1. **Choose upload method**: "Upload the app package to be deployed"
2. **Select your manifest.xml file**
3. **Choose deployment scope**:
   - "Deploy to everyone" (whole organization)
   - "Deploy to specific users/groups"
4. **Click "Deploy"**

---

## 🚨 **Don't Have Admin Access?**

### **Signs You DON'T Have Admin Rights:**
- ❌ admin.microsoft.com shows "Access Denied"
- ❌ No "Admin" tile at office.com
- ❌ Can't see "Settings" in left sidebar

### **What to Do:**
1. **Ask your IT department** to deploy the add-in
2. **Use direct sharing** instead (send manifest.xml to individuals)
3. **Request admin access** if you need it for your role

---

## 🎯 **Alternative: Direct Sharing (No Admin Needed)**

If you don't have admin access, you can still share your add-in:

### **Step 1: Deploy to Cloud**
```bash
npm install -g vercel
cd ppt-addin
vercel
# Get URL like: https://ppt-addin-xyz.vercel.app
```

### **Step 2: Update Manifest**
```xml
<SourceLocation DefaultValue="https://ppt-addin-xyz.vercel.app/taskpane.html" />
```

### **Step 3: Share Manifest File**
- Email the manifest.xml to colleagues
- They load it: Insert → My Add-ins → Upload My Add-in
- Works immediately!

---

## 🔍 **How to Check Your Admin Status**

### **Test 1: Admin Center Access**
Go to: **https://admin.microsoft.com**

**If you see**:
✅ Dashboard with organization stats → You have admin access
❌ "Access Denied" or login loop → You don't have admin access

### **Test 2: Office 365 Portal**
Go to: **https://office.com**

**If you see**:
✅ "Admin" app tile → You have admin access
❌ No "Admin" tile → You don't have admin access

### **Test 3: Ask IT**
Contact your IT department and ask:
- "Do I have Microsoft 365 Global Admin or Application Admin rights?"
- "Can I deploy Office add-ins for our organization?"

---

## 📋 **Full Admin Center Navigation Path**

**Exact clicks in admin.microsoft.com:**

1. **https://admin.microsoft.com** (login)
2. **Left sidebar** → **Settings** (expand if needed)
3. **Settings** → **Integrated apps**
4. **"Upload custom apps"** button
5. **Upload manifest.xml**
6. **Configure deployment scope**
7. **Deploy**

---

## 💡 **Pro Tips**

### **If You Have Admin Access:**
- ✅ Deploy to a **test group first** (not everyone)
- ✅ Monitor usage and feedback
- ✅ Roll out to entire organization after testing

### **If You Don't Have Admin Access:**
- ✅ Use **Vercel deployment + direct sharing**
- ✅ Share with your team first
- ✅ If successful, ask IT to deploy organization-wide

### **Working with IT:**
- 📧 Send them the manifest.xml file
- 📋 Explain what the add-in does
- 🔗 Provide the deployment guide
- 📊 Share usage metrics if you have them

---

## 🚀 **Next Steps**

1. **Check admin access**: Go to https://admin.microsoft.com
2. **If YES**: Follow the Admin Center deployment steps
3. **If NO**: Use Vercel + direct sharing method
4. **Either way**: Your add-in can be shared with others!

**The key is: PowerPoint settings ≠ Microsoft 365 Admin Center!** 🎯