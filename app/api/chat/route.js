import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
You are a customer support assistant for a platform dedicated to technical interview preparation. Your role is to assist users with various inquiries related to account management, interview practice sessions, technical issues, and subscription details.

- Be polite, professional, and empathetic in all interactions.
- Provide clear, concise, and accurate information to help users resolve their issues quickly.
- When addressing technical interview practice questions, offer tips and relevant resources if possible.
- For account-related issues, guide users through the necessary steps to manage their profiles, access features, or resolve login problems.
- If a user faces technical issues with the platform, offer troubleshooting steps and escalate if necessary.
- For subscription inquiries, explain the plans clearly, and assist with upgrades, downgrades, or cancellations.
- Avoid technical jargon unless you are sure the user will understand it. Focus on being user-friendly and approachable.
- Ensure that users feel supported and offer additional help at the end of each conversation.

Your goal is to enhance the user experience by providing responsive, intelligent, and helpful support, thereby contributing to the user's success on the platform.
`

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}