<p align="center">
  <img src="https://reactnative.dev/img/header_logo.svg" height="90" alt="React Native Logo">
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://static.djangoproject.com/img/logos/django-logo-positive.svg" height="90" alt="Django Logo">
</p>

<h1 align="center">AppMovilFront</h1>

<p align="center">
  Cross-platform mobile e-commerce application for perfume shopping, built with React Native and Expo, consuming a Django REST API for authentication, product management, shopping cart, orders and invoicing.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Mobile-61DAFB?logo=react&logoColor=white" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-SDK-000020?logo=expo&logoColor=white" alt="Expo">
  <img src="https://img.shields.io/badge/Expo_Router-Navigation-000020" alt="Expo Router">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Django_REST_Framework-API-092E20?logo=django&logoColor=white" alt="Django REST Framework">
  <img src="https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens" alt="JWT">
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=googlegemini&logoColor=white" alt="Google Gemini">
  <img src="https://img.shields.io/badge/AsyncStorage-Local_Storage-6C63FF" alt="AsyncStorage">
</p>

---


## Table of Contents

- Overview
- Features
- Technology Stack
- Architecture
- Project Structure
- Backend Integration
- Installation
- Environment Variables
- Development
- Deployment
- Security
- Available Scripts
- Project Status
- Author

---

# Overview

AppMovilFront is a cross-platform mobile application developed with **React Native** and **Expo** for an online perfume store.

The application provides a modern shopping experience including user authentication, product catalog, shopping cart, favorites, invoices, payment cards and an AI assistant named **Giulia**, powered by **Google Gemini**. The mobile client communicates with a **Django REST API** responsible for authentication, product management, sales and invoicing.

---

# Features

## Authentication

- User registration
- Secure login
- Password recovery
- Firebase Authentication

## Shopping Experience

- Product catalog
- Product search
- Brand filtering
- Men's and Women's collections
- Product details
- Shopping cart
- Favorites
- Checkout process

## User Account

- User profile
- Purchase history
- Invoice details
- Payment card management

## Artificial Intelligence

- AI assistant powered by Google Gemini
- Personalized perfume recommendations
- Conversation history
- Animated chat interface

## User Experience

- Responsive mobile interface
- Glassmorphism design
- Light animations
- Haptic feedback
- Toast notifications

---

# Technology Stack

| Category | Technology |
|-----------|------------|
| Mobile Framework | React Native |
| Development Platform | Expo |
| Navigation | Expo Router |
| Language | TypeScript |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| AI | Google Gemini API |
| Local Storage | AsyncStorage |
| Animations | Lottie React Native |
| UI Effects | Expo Blur & Linear Gradient |

---

# Architecture

The application is organized into the following modules:

- Authentication
- Product Catalog
- Favorites
- Shopping Cart
- User Profile
- Payment Methods
- Invoices
- AI Assistant
- Firebase Services

---

# Project Structure

```text
AppMovilFront/
│
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   ├── marcas/
│   ├── hombres/
│   └── mujeres/
│
├── components/
├── contexts/
├── utils/
├── assets/
├── config.js
└── package.json
```

---

# Backend Integration

The application consumes a **Django REST API** responsible for:

- User authentication
- Product management
- Brand catalog
- Shopping cart
- Sales processing
- Invoice generation
- Customer information

The backend endpoint is dynamically configured at runtime with fallback support for local development.

---

# Installation

Clone the repository.

```bash
git clone <repository-url>

cd AppMovilFront
```

Install dependencies.

```bash
npm install
```

Configure Firebase credentials.

Start the development server.

```bash
npm start
```

---

# Environment Variables

Configure Firebase and AI credentials before running the application.

```env
EXPO_PUBLIC_FIREBASE_API_KEY=

EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=

EXPO_PUBLIC_FIREBASE_PROJECT_ID=

EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=

EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

EXPO_PUBLIC_FIREBASE_APP_ID=

EXPO_PUBLIC_GEMINI_API_KEY=
```

Sensitive credentials should never be committed to the repository.

---

# Development

Run the Expo development server.

```bash
npm start
```

Run on Android.

```bash
npm run android
```

Run on iOS.

```bash
npm run ios
```

Run on Web.

```bash
npm run web
```

---

# Deployment

The application is designed to run through **Expo** and can be distributed using **Expo Application Services (EAS Build)** for Android and iOS.

Before deployment ensure:

- Firebase is configured.
- Backend API is available.
- Environment variables are properly configured.

---

# Security

The application follows modern security practices.

- Firebase Authentication
- Secure API communication
- Local encrypted storage
- Protected user sessions

Sensitive credentials and API keys should never be committed to the repository.

---

# Available Scripts

| Command | Description |
|----------|-------------|
| npm start | Start Expo development server |
| npm run android | Run on Android |
| npm run ios | Run on iOS |
| npm run web | Run on Web |
| npm run lint | Run ESLint |

---

# Project Status

The application is fully functional and includes:

- Mobile authentication
- Product catalog
- Shopping cart
- Favorites
- AI assistant
- Invoice management
- Payment methods
- Firebase integration
- Django REST API integration
- Cross-platform support

---

# Author

Cross-platform mobile e-commerce application developed with **React Native**, **Expo**, **Firebase** and **Google Gemini**, integrated with a **Django REST backend** to deliver a modern digital shopping experience.
