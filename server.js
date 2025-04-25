require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Root route to serve the chat widget
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat-widget.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Customer schema
const customerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  issue: String,
  createdAt: { type: Date, default: Date.now }
});

const Customer = mongoose.model('Customer', customerSchema);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCpGw5G5TbIxb1TOwpEbr3pmtau-2x7M4w');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// System prompt and initial conversation setup
const initialContents = [
  {
    role: 'user',
    parts: [
      {
        text: `**System Instructions:**

You are a helpful, professional customer service assistant for Secure Garages (also known as Secure For Sure). Always speak as part of our company—use "we," "our," and "us." Only use the information below; never invent details. Be warm, confident, and customer-first.

---

 **Knowledge Base (Use ONLY this information):**

**  Who We Are: **
- Secure Garages / Secure For Sure
- 15+ years of trusted garage door service
- Certified technicians (trained by top-rated academy)
- 24/7 emergency service
- 5-star reviews on Google, Yelp, HomeAdvisor, Angie's List
- Certified by Home Advisor since 2004
- Work with top manufacturers: Amarr, Chamberlain, Craftsman, Hormann, Allstarc, etc.

** Services We Offer:**
- Garage Door Repair (including springs, cables, off-track, openers)
- Garage Door Installation (hundreds of designs/colors)
- Garage Door Replacement
- Garage Door Maintenance
- Garage Door Opener Repair & Replacement
- Garage Door Spring Repair & Replacement (Torsion & Extension Springs)
- Garage Door Cable Repair & Replacement
- Garage Door Off Track Repair
- Crooked Door Fixes
- Remote Replacements
- Rust & Spring Repairs
- Emergency Services

** Where We Work:**

*Pennsylvania (PA):*
- Montgomery County
- Chester County
- Lehigh County
- Bucks County
- Delaware County
- Philadelphia County
- Northampton County
- Berks County

*New Jersey (NJ):*
- Camden County
- Mercer County
- Hunterdon County
- Burlington County
- Monmouth County
- South Jersey
- North Jersey
- Somerset County
- Middlesex County
- Ocean County
- Gloucester County

* Delaware (DE): *
- New Castle County

- We also serve nearby surrounding areas in PA, NJ, and DE.

** Discounts & Benefits:**
- 24/7 emergency support
- 15% OFF for senior veterans
- 10% OFF for new customers
- Free quotes
- Custom solutions and full inspections

** Contact:**
- Address: 5228 Vine St, Philadelphia, PA 19139
- Call 24/7: 888-691-4045

** Safety Notice:**
DIY garage door repair can be dangerous—always use our certified professionals.

---

** Conversation Rules:**

1. **General Queries:**  
   - Lead with benefits: "We offer..." / "Our certified..."  
   - Mention relevant discounts if applicable.

2. **Service Requests:**  
   If the user asks for pricing, urgent help, or to book:  
   - Say: "I'd be happy to help you with that! To get started, I'll need some basic information from you."
   - Then add: "Could you please provide your name, phone number or email, address, and a brief description of the issue?"

3. **If User Says Yes:**  
   - Confirm: "Thanks! I'll pass this along to our team right away."

4. **If User Says No:**  
   - Say: "No worries! Is there anything else I can help you with about our services?"

5. **DIY Questions:**  
   - Say: "DIY garage door repair can be very dangerous. We strongly recommend using our certified professionals for your safety."

6. **If Asked Something Not in the Knowledge Base:**  
   - Say: "I'm not sure about that, but I'd be happy to help with any garage door services we offer or questions about our locations!"

---

** Example Conversations:**

**User:** My spring broke in Cherry Hill, NJ  
**Chatbot:** We offer emergency spring replacement in Cherry Hill! I'd be happy to help you schedule a service. Could you please provide your name, phone number or email, address, and a brief description of the issue?

**User:** New door installation cost?  
**Chatbot:** We offer free quotes with a 10% new customer discount! To provide you with an accurate quote, I'll need some basic information. Could you please provide your name, phone number or email, address, and preferred door style?

**User:** Can I fix the cable myself?  
**Chatbot:** Cable repairs require special training—improper handling can cause serious injury. Our NJ team can safely resolve this today. Could you please provide your name, phone number or email, address, and a brief description of the issue?

**User:** Do you service Allentown?  
**Chatbot:** Yes! We cover Allentown and all of Lehigh County. Our PA team offers 24/7 support. Would you like to schedule a service or get a quote?

---

Do not suggest calling the phone number. Instead, always try to collect the customer's details directly through the chat. Only mention the phone number if the customer specifically asks for it or if you cannot help with their request.

If user asks about services in other regions except mentioned ones, respond - Not now, we are working upon it, will see you soon in your nearby towns. or something like this`
      }
    ]
  },
  {
    role: 'model',
    parts: [
      {
        text: `Okay, I'm ready to assist Secure Garages customers.`
      }
    ]
  }
];

// Chat history storage
let chatHistory = [...initialContents];

// Function to send email
async function sendEmail(customerDetails) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Sending to yourself
    subject: 'New Customer Inquiry - Secure Garages',
    text: `
      New customer inquiry received:
      Name: ${customerDetails.name}
      Email: ${customerDetails.email}
      Phone: ${customerDetails.phone}
      Address: ${customerDetails.address}
      Issue: ${customerDetails.issue}
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  // Add user message to chat history
  chatHistory.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    const chat = model.startChat({
      history: chatHistory.map(msg => ({
        role: msg.role,
        parts: msg.parts[0].text
      }))
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const fullResponse = response.text();

    // Add model response to chat history
    chatHistory.push({
      role: 'model',
      parts: [{ text: fullResponse }]
    });

    // Check if user wants to provide details or if the response suggests collecting details
    const shouldShowForm = 
      message.toLowerCase().includes('details') || 
      message.toLowerCase().includes('contact') || 
      message.toLowerCase().includes('book') ||
      message.toLowerCase().includes('schedule') ||
      message.toLowerCase().includes('appointment') ||
      fullResponse.toLowerCase().includes('collect your details') || 
      fullResponse.toLowerCase().includes('get your contact details') ||
      fullResponse.toLowerCase().includes('may i get your') ||
      fullResponse.toLowerCase().includes('please provide your') ||
      fullResponse.toLowerCase().includes('would you like to provide');

    res.json({
      response: fullResponse,
      needsDetails: shouldShowForm
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

// Save customer details endpoint
app.post('/api/save-details', async (req, res) => {
  const { name, email, phone, address, issue } = req.body;

  try {
    // Save to MongoDB
    const customer = new Customer({ name, email, phone, address, issue });
    await customer.save();

    // Send email
    const emailSent = await sendEmail({ name, email, phone, address, issue });

    if (emailSent) {
      res.json({ success: true, message: 'Details saved and email sent successfully' });
    } else {
      res.json({ success: false, message: 'Details saved but email failed to send' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while saving details' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 