# Secure Garages Chatbot

A chatbot for Secure Garages that handles customer inquiries and collects contact information.

## Features

- Interactive chat interface using Gemini AI
- Customer details collection
- Email notifications for new inquiries
- MongoDB database storage
- Floating chat widget for website integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Gmail account for email notifications

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   EMAIL_USER=your_gmail_address
   EMAIL_PASS=your_gmail_app_password
   PORT=3000
   ```

4. Start MongoDB locally or update the connection string in `server.js` for MongoDB Atlas

5. Start the server:
   ```bash
   npm start
   ```

## Usage

1. The chat widget can be embedded in any website by including the `chat-widget.html` file
2. The chatbot will automatically respond to customer inquiries
3. When a customer agrees to provide details, a form will appear to collect:
   - Name
   - Email
   - Phone Number
   - Address
   - Issue Description

4. Once submitted, the details will be:
   - Saved to MongoDB
   - Sent as an email to the configured email address

## API Endpoints

- `POST /api/chat` - Send a message to the chatbot
- `POST /api/save-details` - Save customer details and send email

## Security Notes

- Never commit the `.env` file to version control
- Use environment variables for sensitive information
- Ensure proper CORS configuration for production use #   c u s t o m _ c h a t _ b o t  
 #   C u s t o m _ C h a t B o t  
 