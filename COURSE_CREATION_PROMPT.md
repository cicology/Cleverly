# Course Creation Modal - Comprehensive Breakdown

## Overview

The Course Creation Modal is a two-tab interface that allows users to create new courses with associated topics, subtopics, and study materials. The modal supports both manual topic entry and AI-powered automatic topic extraction from uploaded study guides. All data is persisted to a Supabase database with proper user authentication and ownership tracking.

---

## Frontend Structure

### Modal Container

The modal is contained within a fixed overlay (`#courseModal`) that covers the entire screen with a semi-transparent black background. The modal content is a centered white card with rounded corners, maximum width of 4xl (896px), and scrollable content area limited to 90% viewport height. The header features a gradient background (blue-500 to blue-600) with white text displaying "Create New Course" alongside a book icon, and includes a close button.

### Tab Navigation System

The modal uses a two-tab navigation system with visual indicators for the active tab. The tabs are controlled by JavaScript functions that toggle visibility of content sections and update button states accordingly.

- **Tab 1: Course Information** - Contains all basic course metadata fields including university name, course name, course code, description, duration, year/semester (conditional), instructor, and moderator.

- **Tab 2: Topics & Materials** - Contains file upload areas for study guide, textbook, and extra content, plus the topics management interface with manual entry and AI extraction capabilities.

---

## Form Fields Specification

### Tab 1: Course Information Fields

**University/Institute Name**
- Input type: Text input
- Field name: `university_name`
- Required: Yes
- Placeholder: "e.g., Harvard University, MIT, Stanford"
- Validation: Must not be empty

**Course Name**
- Input type: Text input
- Field name: `course_name`
- Required: Yes
- Placeholder: "e.g., Introduction to Calculus"
- Validation: Must not be empty

**Course Code**
- Input type: Text input
- Field name: `course_code`
- Required: Yes
- Placeholder: "e.g., MATH101"
- Validation: Must not be empty

**Description**
- Input type: Textarea (4 rows)
- Field name: `description`
- Required: No
- Placeholder: "Brief description of the course content and objectives"

**Course Duration**
- Input type: Select dropdown
- Field ID: `courseDuration`
- Field name: `duration`
- Required: Yes
- Options:
  - Year (Full Academic Year)
  - Semester (Half Year)
  - Trimester (One Third Year)
  - Quarter (3 Months)
  - Month (4 Weeks)
  - Biweek (2 Weeks)
  - Week (7 Days)
  - Intensive (1-3 Days)
  - Workshop (Single Day)
  - Custom Duration
- Special behavior: When "Semester", "Year", or "Trimester" is selected, the Year and Semester fields become visible and required

**Year**
- Input type: Select dropdown
- Field ID: `courseYear`
- Field name: `year`
- Required: Conditionally (only when duration is Semester/Year/Trimester)
- Options: 2024, 2025 (default selected), 2026, 2027, 2028
- Visibility: Hidden by default, shown when duration warrants it

**Semester**
- Input type: Select dropdown
- Field ID: `courseSemester`
- Field name: `semester`
- Required: Conditionally (only when duration is Semester/Year/Trimester)
- Options: Semester 1, Semester 2, Fall, Spring, Summer, Winter
- Visibility: Hidden by default, shown when duration warrants it

**Instructor**
- Input type: Text input
- Field name: `instructor`
- Required: No
- Placeholder: "e.g., Dr. John Smith"

**Moderator/Teaching Assistant**
- Input type: Text input
- Field name: `moderator`
- Required: No
- Placeholder: "e.g., Jane Doe, Teaching Assistant"

### Tab 2: Topics & Materials Fields

**Study Guide Upload**
- Input type: File input (multiple files allowed)
- Field ID: `modal_study_guide_input`
- Field name: `study_guide`
- Required: No
- Accepted formats: PDF, DOC, DOCX, TXT, MD
- Maximum size: 10MB per file
- Special behavior: When files are uploaded, the "Auto-Extract Topics" button becomes visible

**Auto-Extract Topics Button**
- Button ID: `modalExtractTopicsBtn`
- Behavior: Triggers AI topic extraction from uploaded study guide
- Shows loading spinner during processing
- Emits Socket.IO events for real-time progress updates

**Topic Input**
- Input type: Text input
- Field ID: `topicInput`
- Required: No
- Placeholder: "Type topic name (e.g., Calculus Basics)"
- Behavior: Press Enter or click "Add Topic" button to add topic to list

**Topics List Container**
- Container ID: `modalTopicsListContainer`
- Displays added topics with their subtopics
- Each topic shows as a card with topic name, subtopic input field, and subtopic tags
- Topics can be removed individually
- Subtopics can be added/removed per topic

**Topics Hidden Input**
- Input type: Hidden
- Field ID: `topicsHidden`
- Contains JSON stringified array of topics with their subtopics
- Format: `[{"topic": "Topic Name", "subtopics": ["sub1", "sub2"]}]`

**Textbook Upload**
- Input type: File input (multiple files allowed)
- Field name: `textbook`
- Required: No
- Accepted formats: PDF, DOC, DOCX, TXT, MD
- Maximum size: 10MB per file

**Extra Content Upload**
- Input type: File input (multiple files allowed)
- Field name: `extra_content`
- Required: No
- Accepted formats: PDF, DOC, DOCX, TXT, MD
- Maximum size: 10MB per file

---

## Topics Data Structure

### Frontend Array Format (modalTopicsData)

The frontend maintains topics in a JavaScript array where each element is an object containing the topic name and an array of subtopics:

```javascript
[
  {
    name: "Topic Name",
    subtopics: ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
  },
  {
    name: "Another Topic",
    subtopics: ["Learning Outcome A", "Learning Outcome B"]
  }
]
```

### Backend JSONB Format (Supabase)

The backend stores topics in a nested JSON object format with sequential topic keys:

```json
{
  "topic_1": {
    "topic": "Topic Name",
    "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
  },
  "topic_2": {
    "topic": "Another Topic",
    "subtopics": ["Learning Outcome A", "Learning Outcome B"]
  }
}
```

### Conversion Between Formats

The system includes helper functions to convert between these formats. When saving to the backend, the frontend array is converted to the nested object format. When loading from the backend, the nested format is converted back to an array for display.

---

## Backend Workflow Steps

### Step 1: Form Submission and Initial Validation

When the user submits the form, the system performs the following actions:

- Receives POST request to `/api/v1/courses` endpoint
- Extracts form data from multipart/form-data request
- Validates that all required fields are present (university_name, course_name, course_code, duration)
- Authenticates the user via JWT token in the Authorization header
- Extracts session_id from form data for linking with cached topic extraction results

### Step 2: Process Topics Data

The topics processing handles multiple input sources:

- Checks if topics were provided via manual input (JSON in topicsHidden field)
- Checks if topics were cached from AI extraction (using session_id as cache key)
- Parses the topics JSON into the structured backend format
- Validates that the topics structure is correct (each topic has "topic" string and "subtopics" array)
- Merges any manually added topics with AI-extracted topics if both exist

### Step 3: Create Course Record in Database

The system creates the initial course record:

- Generates a unique UUID for the course
- Inserts a new record into the Supabase 'courses' table with all provided fields
- Sets initial status to 'pending' or 'processing' depending on whether files were uploaded
- Stores the topics JSONB, timestamps, and user_id for ownership
- Returns the course ID for subsequent file processing steps
- Immediately emits 'course_added' Socket.IO event to update the frontend

### Step 4: Process Uploaded Files (Background Task)

For each uploaded file (study_guide, textbook, extra_content):

- Validates file size does not exceed 10MB
- Validates file extension is in allowed list (PDF, DOC, DOCX, TXT, MD)
- Generates a unique filename using UUID to prevent collisions
- Uploads the file to Supabase Storage bucket under course-specific folder
- Creates a file record in the 'course_files' table with metadata including original filename, file type, storage path, size, and MIME type
- Sets initial embedding_status to 'pending' in file metadata

### Step 5: Extract Text from Files

For each uploaded file that needs processing:

- Reads the file from Supabase Storage
- Determines the file type from extension
- Uses DocumentProcessor service to extract text content based on file type:
  - PDF files: Extracts using PyPDF2 or pdfplumber library
  - DOCX files: Extracts using python-docx library
  - DOC files: Extracts using antiword or similar converter
  - TXT/MD files: Direct text read
- Stores the extracted text temporarily for embedding creation
- Handles extraction errors gracefully and logs issues

### Step 6: Create Embeddings (AI Processing)

For each file with successfully extracted text:

- Splits text into chunks of approximately 8000 tokens each to fit within embedding model limits
- For each text chunk:
  - Calls OpenAI Embeddings API using text-embedding-ada-002 model
  - Stores the resulting 1536-dimensional embedding vector in Supabase
  - Creates record in 'course_embeddings' table linking to course and file
  - Includes chunk_index, original text content, and embedding vector
- Updates the file metadata to set embedding_status to 'ready'
- Emits Socket.IO progress events during processing ('file_processing_complete' for each file)

### Step 7: AI Topic Extraction (Optional Workflow)

When the user clicks "Auto-Extract Topics" button:

- Receives the study guide file content
- Builds a comprehensive prompt instructing the AI to:
  - Extract actual curriculum topics and learning outcomes
  - Exclude organizational labels like "THEME 1", "UNIT 2.3", etc.
  - Return structured JSON with sequential topic keys
  - Focus on what students learn, not curriculum organization
- Calls OpenAI API using gpt-5-mini-2025-08-07 model with responses.create() method
- Parses the JSON response into the topics structure
- Caches the extracted topics in session storage keyed by session_id
- Emits 'topics_extracted' Socket.IO event with the topics data
- Frontend automatically populates the topics list with extracted content

### Step 8: Update Course Status and Notify

After all processing is complete:

- Updates the course record in database:
  - Sets status to 'ready' if all processing succeeded
  - Sets status to 'error' if any processing failed
  - Updates file_counts object with totals for each file type
- Emits 'course_complete' Socket.IO event with:
  - course_id, course_name
  - file_count total
  - Array of processed files with their statuses
- If errors occurred, emits 'course_error' event with error details
- Frontend updates the course card in real-time based on these events

---

## Socket.IO Events

### Client-to-Server Events

- **join** - Client joins a session room for receiving real-time updates. Payload contains session_id string.

### Server-to-Client Events

- **topics_extraction_started** - Indicates topic extraction has begun. Payload contains message and session_id.

- **topics_extraction_progress** - Provides progress updates during extraction. Payload contains message, progress percentage (0-100), and session_id.

- **topics_extracted** - Delivers extracted topics when complete. Payload contains topics object in backend format and session_id.

- **topics_extraction_error** - Reports extraction failure. Payload contains error message and session_id.

- **course_added** - Confirms course was saved to database. Payload contains full course object.

- **course_complete** - Indicates all processing finished successfully. Payload contains course_id, course_name, file_count, and files array with details.

- **course_error** - Reports processing failure. Payload contains course_id and error message.

- **file_processing_complete** - Confirms individual file processing finished. Payload contains course_id, file_id, and file_name.

- **file_processing_error** - Reports individual file processing failure. Payload contains course_id, file_id, file_name, and error message.

---

## Database Schema

### courses Table

The courses table stores all course metadata and topics:

- **id** - UUID primary key, auto-generated
- **user_id** - UUID foreign key referencing auth.users(id), identifies course owner
- **university_name** - TEXT, required, stores institution name
- **course_name** - TEXT, required, stores course title
- **course_code** - TEXT, required, stores course identifier
- **description** - TEXT, optional, stores course description
- **duration** - TEXT, required, stores selected duration type
- **year** - TEXT, optional, stores academic year
- **semester** - TEXT, optional, stores semester/term
- **instructor** - TEXT, optional, stores instructor name
- **moderator** - TEXT, optional, stores TA/moderator name
- **topics** - JSONB, defaults to empty object, stores nested topics structure
- **status** - TEXT, defaults to 'pending', tracks processing state
- **file_counts** - JSONB, defaults to empty object, stores file type counts
- **created_at** - TIMESTAMP, auto-set to current time
- **updated_at** - TIMESTAMP, auto-set to current time

### course_files Table

The course_files table tracks all uploaded files:

- **id** - UUID primary key, auto-generated
- **course_id** - UUID foreign key referencing courses(id) with CASCADE delete
- **file_name** - TEXT, required, stores original filename
- **file_type** - TEXT, required, stores file category (study_guide/textbook/extra_content)
- **file_path** - TEXT, required, stores Supabase Storage path
- **file_size** - INTEGER, optional, stores file size in bytes
- **mime_type** - TEXT, optional, stores MIME type
- **metadata** - JSONB, defaults to empty object, stores embedding_status and other metadata
- **created_at** - TIMESTAMP, auto-set to current time

### course_embeddings Table

The course_embeddings table stores vector embeddings for semantic search:

- **id** - UUID primary key, auto-generated
- **course_id** - UUID foreign key referencing courses(id) with CASCADE delete
- **file_id** - UUID foreign key referencing course_files(id) with CASCADE delete
- **chunk_index** - INTEGER, stores position of chunk within file
- **text_content** - TEXT, stores original text that was embedded
- **embedding** - VECTOR(1536), stores the embedding vector from OpenAI
- **created_at** - TIMESTAMP, auto-set to current time

---

## API Endpoints

### Course Management Endpoints

- **POST /api/v1/courses** - Creates a new course with all provided data. Requires authentication. Accepts multipart/form-data. Returns created course object.

- **GET /api/v1/courses** - Lists all courses owned by the authenticated user. Requires authentication. Returns array of course objects with their files and topics.

- **GET /api/v1/courses/{id}** - Gets detailed information for a specific course. Requires authentication and ownership verification. Returns full course object with files.

- **PATCH /api/v1/courses/{id}** - Updates course fields including topics. Requires authentication and ownership verification. Accepts JSON body with fields to update.

- **DELETE /api/v1/courses/{id}** - Deletes a course and all associated files and embeddings. Requires authentication and ownership verification. Cascades to related tables.

### File Management Endpoints

- **POST /api/v1/courses/{id}/files** - Uploads a new file to an existing course. Requires authentication. Accepts multipart/form-data with file and file_type.

- **DELETE /api/v1/courses/{id}/files/{file_id}** - Deletes a specific file from a course. Requires authentication. Removes from storage and database.

### Topic Management Endpoints

- **POST /api/v1/extract-topics** - Triggers AI topic extraction from uploaded study guide. Does not require authentication (uses session). Accepts multipart/form-data with study guide file and session_id.

- **POST /api/v1/courses/{id}/topics** - Adds a new topic to an existing course. Requires authentication. Accepts JSON body with topic_name. Returns new topic key and data.

- **POST /api/v1/courses/{id}/topics/{topic_key}/subtopics** - Adds a subtopic to an existing topic. Requires authentication. Accepts JSON body with subtopic_name.

---

## Frontend JavaScript Functions

### Modal Control Functions

- **openCourseModal()** - Displays the course creation modal, resets the form, and initializes Socket.IO connection.

- **closeCourseModal()** - Hides the modal, resets all form fields, clears topics data, and removes file displays.

- **switchCourseTab(tab)** - Switches between 'info' and 'materials' tabs, updates visual states and button visibility.

- **nextCourseTab()** - Advances to the materials tab.

- **previousCourseTab()** - Returns to the info tab.

### Topics Management Functions

- **addCourseTopic()** - Adds a new topic from the input field to modalTopicsData array and re-renders the display.

- **removeModalTopic(index)** - Removes a topic at the specified index from modalTopicsData.

- **addModalSubtopic(topicIndex, subtopic)** - Adds a subtopic to the specified topic if not already present.

- **removeModalSubtopic(topicIndex, subIndex)** - Removes a subtopic from the specified topic.

- **renderModalTopics()** - Re-renders the entire topics list UI from modalTopicsData array and updates the hidden input field.

### File Handling Functions

- **handleModalStudyGuideUpload(input)** - Processes study guide file selection, displays filenames, and shows the extract topics button.

- **extractTopicsFromModalStudyGuide()** - Initiates AI topic extraction by uploading the study guide and waiting for Socket.IO response.

- **displayFileNames(input, displayId)** - Shows uploaded file names with size in the specified container.

### Socket.IO Functions

- **initializeSocket()** - Establishes Socket.IO connection, generates session ID, joins session room, and sets up all event listeners for real-time updates.

### Form Submission Functions

- **Form submit event handler** - Collects all form data, shows processing status, uploads to backend, handles success/error responses, and triggers course card updates.

- **resetCourseForm()** - Resets all form fields, clears topics, hides messages, and returns to the first tab.

---

## User Experience Flow

### Creating a Course with Manual Topics

1. User clicks "Create Course" button to open the modal
2. User fills in required fields on the Course Information tab (university, course name, code, duration)
3. User optionally fills in description, instructor, and moderator
4. User clicks "Next" to proceed to Topics & Materials tab
5. User types a topic name and clicks "Add Topic" or presses Enter
6. User adds subtopics to each topic using the subtopic input field
7. User optionally uploads study guide, textbook, and extra content files
8. User clicks "Create Course" to submit
9. Modal shows processing status with progress bar
10. On success, modal closes and course card appears in the courses list with "Processing" status
11. Background processing completes and course card updates to "Ready" status via Socket.IO

### Creating a Course with AI Topic Extraction

1. User opens modal and fills in Course Information tab
2. User navigates to Topics & Materials tab
3. User uploads a study guide (PDF/DOCX)
4. "Auto-Extract Topics" button appears
5. User clicks the button to initiate extraction
6. Progress indicator shows extraction status ("Processing study guide...", "AI processing...", etc.)
7. Extracted topics automatically populate the topics list with subtopics
8. User can modify, add, or remove topics/subtopics as needed
9. User completes form submission as normal

### Real-Time Updates After Submission

1. Course immediately appears in courses list with "Processing" badge
2. Socket.IO events update the UI as processing progresses
3. File processing status icons update from spinner to checkmark
4. When complete, status badge changes from "Processing" to "Ready"
5. Toast notifications inform user of completion or errors
6. Course details modal shows full information including all processed files
