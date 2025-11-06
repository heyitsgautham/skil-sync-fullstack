# ElevenLabs UI: Open-Source Audio and Agent Components Documentation

This document provides a comprehensive guide for setting up and using the ElevenLabs UI, an open-source component library for building multimodal agent and audio interfaces on the web. This documentation is structured for quick reference and integration, suitable for use with tools like GitHub Copilot.

## 1. Overview

**ElevenLabs UI** is a collection of customizable React components built on top of `shadcn/ui`. It is designed to accelerate the development of web applications that integrate with the ElevenLabs Agents and Audio SDKs, providing pre-built UI primitives like waveforms, orbs, and chat interfaces.

**Key Features:**
*   **Open Source:** Full source code is available for customization.
*   **Component-based:** Provides modular components like `Conversation`, `Orb`, `Waveform`, and `Message`.
*   **CLI Integration:** Components are installed directly into your project's codebase using a dedicated CLI, similar to `shadcn/ui`.

## 2. Prerequisites

Before installing ElevenLabs UI components, ensure your development environment meets the following requirements:

| Requirement | Version/Description | Notes |
| :--- | :--- | :--- |
| **Node.js** | Version 18 or later | Required for modern JavaScript development. |
| **Project Type** | A Next.js project | The components are designed for the React ecosystem, specifically Next.js. |
| **UI Framework** | `shadcn/ui` setup | If not already set up, running the ElevenLabs CLI will prompt you to configure `shadcn/ui` first. |

## 3. Installation and Setup

ElevenLabs UI components are installed using the dedicated ElevenLabs CLI. This process adds the component's source code and necessary dependencies directly to your project's component directory (e.g., `components/ui`).

### 3.1. Installing a Component

Use the `pnpm dlx @elevenlabs/cli` command to add a specific component.

**Syntax:**

```bash
pnpm dlx @elevenlabs/cli@latest components add <component-name>
```

**Example: Installing the `Orb` component**

The `Orb` component is a visual indicator often used to show agent activity or listening state.

```bash
pnpm dlx @elevenlabs/cli@latest components add orb
```

**Example: Installing the `Conversation` component**

The `Conversation` component is a complex chat container.

```bash
pnpm dlx @elevenlabs/cli@latest components add conversation
```

### 3.2. Alternative Installation (Manual)

If you prefer to use the standard `shadcn/ui` CLI, you can configure it to use the ElevenLabs UI registry. However, the dedicated `@elevenlabs/cli` is the recommended and fastest method.

## 4. Usage Examples

Once a component is installed, you can import and use it like any other React component in your project.

### 4.1. Basic Component Usage (`Orb`)

The following example demonstrates how to import and use the simple `Orb` component within a React functional component.

```jsx
"use client"

import { Card } from "@/components/ui/card"
import { Orb } from "@/components/ui/orb"

export default function AgentStatus() {
  return (
    <Card className="flex items-center justify-center p-8">
      <Orb />
    </Card>
  )
}
```

### 4.2. Advanced Component Usage (`Conversation`)

The `Conversation` component is a container for chat interfaces, providing auto-scroll and a scroll-to-bottom button. It is composed of several sub-components.

**Installation (if not already done):**

```bash
pnpm dlx @elevenlabs/cli@latest components add conversation
```

**Implementation Example:**

```jsx
"use client"

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation"

// Assume 'messages' is an array of message objects:
// const messages = [{ id: 1, content: "Hello" }, { id: 2, content: "Hi there!" }]

export default function AgentChatInterface({ messages }) {
  return (
    <Conversation>
      <ConversationContent>
        {messages.length === 0 ? (
          // Display a friendly message when the chat is empty
          <ConversationEmptyState
            title="No messages yet"
            description="Start a conversation to see messages here"
          />
        ) : (
          // Map over the messages array to display content
          messages.map((message) => (
            <div key={message.id} className="p-2 border-b">
              {message.content}
            </div>
          ))
        )}
      </ConversationContent>
      {/* Scroll button appears when the user scrolls away from the bottom */}
      <ConversationScrollButton />
    </Conversation>
  )
}
```

**Key Sub-Components of `Conversation`:**

| Component | Description |
| :--- | :--- |
| **`Conversation`** | The main container. Manages scrolling behavior and sticky-to-bottom functionality. |
| **`ConversationContent`** | Container for the actual message elements. |
| **`ConversationEmptyState`** | A utility component to display a message when the conversation is empty. |
| **`ConversationScrollButton`** | A button that appears when the user scrolls up, allowing them to quickly jump back to the latest message. |

## 5. Next Steps

To fully integrate the components, you will likely need to connect them to the ElevenLabs Agents and Audio SDKs.

1.  **Explore Components:** Review the full list of available components on the ElevenLabs UI documentation site (e.g., `Waveform`, `Message`, `Mic Selector`).
2.  **Integrate SDKs:** Refer to the official ElevenLabs documentation for integrating the Agents and Audio SDKs to manage state, send requests, and handle audio streams.
3.  **Customization:** Since the components are added to your codebase, you can modify their styles and logic to perfectly match your application's design system.
