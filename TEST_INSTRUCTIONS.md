# Quiz Taking System - Test Instructions

## 🎯 **How to Test the Quiz Taking Flow**

The quiz taking system is working correctly! Here's how to test it:

### **Step 1: Create a Quiz (Admin)**

1. **Sign in as Admin**:
   - Go to `http://localhost:3001`
   - Sign in with an admin account
   - You should see the "Create New Quiz" interface

2. **Create a Quiz**:
   - Fill in the quiz title (e.g., "Test Quiz")
   - Fill in the description (e.g., "This is a test quiz")
   - Click "Create Quiz Room"
   - You'll get an **invite code** (e.g., "ABC123")

3. **Add Questions**:
   - After creating the quiz, the "Manage Questions" section appears
   - Click "Add Question" button
   - Fill in:
     - Question text: "What is 2+2?"
     - Option A: "3"
     - Option B: "4" 
     - Option C: "5"
     - Option D: "6"
     - Correct Option: "B"
     - Marks: "1"
   - Click "Add Question"
   - Add a few more questions for testing

### **Step 2: Join as Participant**

1. **Sign in as Participant**:
   - Open a new browser tab/window (or use incognito)
   - Go to `http://localhost:3001`
   - Sign in with a participant account
   - You should see the "Join a Quiz Room" interface

2. **Join the Room**:
   - Enter the **invite code** from Step 1 (e.g., "ABC123")
   - Click "Join Room"
   - **You should be automatically redirected to the quiz page!**

### **Step 3: Take the Quiz**

1. **Quiz Ready Screen**:
   - You'll see a "Quiz Ready!" screen with quiz statistics
   - Shows number of questions, total marks, and time limit
   - Click "Start Quiz" to begin

2. **Taking the Quiz**:
   - Navigate through questions using Previous/Next buttons
   - Select answers by clicking on options
   - Use the question number buttons to jump between questions
   - Timer counts down from 30 minutes
   - Submit when finished

3. **Quiz Completion**:
   - See completion screen with statistics
   - Return to dashboard

## 🔧 **Troubleshooting**

### **If Redirect Doesn't Work:**

1. **Check Console Errors**:
   - Open browser developer tools (F12)
   - Check for any JavaScript errors in the console

2. **Verify Invite Code**:
   - Make sure you're using the exact invite code from the admin quiz creation
   - Codes are case-sensitive and exactly 6 characters

3. **Check Network Tab**:
   - In developer tools, check the Network tab
   - You should see:
     - `POST /api/rooms/join` (should return 200)
     - Navigation to `/dashboard/quiz?inviteCode=XXXXXX`
     - `POST /api/rooms/get-room-id` (should return 200)
     - `GET /api/questions/get/[roomId]` (should return 200)

### **Common Issues:**

1. **"Invalid invite code" error**:
   - The invite code doesn't exist in the database
   - Make sure you created a quiz first as admin
   - Copy the exact invite code from the admin interface

2. **"No questions found" error**:
   - The quiz exists but has no questions
   - Go back to admin and add questions to the quiz

3. **Page doesn't load**:
   - Check if the development server is running
   - Verify the URL is correct: `/dashboard/quiz?inviteCode=XXXXXX`

## ✅ **Expected Behavior**

When everything is working correctly:

1. **Admin creates quiz** → Gets invite code
2. **Admin adds questions** → Quiz is ready
3. **Participant enters invite code** → Automatically redirects to quiz page
4. **Participant takes quiz** → Smooth quiz experience
5. **Participant completes quiz** → Returns to dashboard

## 🎉 **Success Indicators**

- ✅ Automatic redirect after entering valid invite code
- ✅ Quiz page loads with "Quiz Ready!" screen
- ✅ Questions display correctly with options
- ✅ Navigation between questions works
- ✅ Timer counts down properly
- ✅ Quiz completion screen appears

The system is working as designed! The key is having a valid invite code from a quiz that has questions.
