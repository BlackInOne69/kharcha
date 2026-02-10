# 💸 Kharcha

**Kharcha** is a comprehensive personal finance management application designed for students and young professionals to track expenses, manage budgets, split bills, and gain AI-powered financial insights.

Built with **React Native (Expo)** for cross-platform mobile support and **Django REST Framework** with **PostgreSQL** for a robust backend, Kharcha offers a modern, dark-themed UI with real-time analytics and intelligent expense tracking.

---

## ✨ Features

### 💰 Expense Management
- **Manual Expense Entry** – Quick and easy expense logging with category support
- **Receipt Scanning** – OCR-powered receipt scanning with AI extraction of amount, merchant, and date
- **Multi-Source Tracking** – Track expenses from manual entry, receipts, or bank imports
- **Category Management** – Organize expenses with customizable categories
- **Payment Method Tracking** – Support for Cash, eSewa, Khalti, Bank, Card, and more

### 📊 Analytics & Insights
- **Dynamic Statistics** – View spending patterns by Weekly, Monthly, or Yearly periods
- **Interactive Charts** – Beautiful line charts with hover tooltips and smooth animations
- **Category Breakdown** – Visual breakdown of spending by category with percentages
- **Spending Trends** – Track your financial habits over time

### 🎯 Budgeting
- **Monthly Budgets** – Set spending limits and track progress
- **Budget Alerts** – Get notified when approaching limits
- **Category Budgets** – Allocate budgets per expense category
- **Visual Progress** – Circular progress indicators and percentage tracking

### 🤖 AI Integration
- **Gemini-Powered Chatbot** – Get personalized financial advice
- **Smart Insights** – AI analyzes your spending patterns
- **Receipt OCR** – Automatic data extraction from receipt images
- **Confidence Scoring** – AI provides confidence levels for extracted data

### 🎨 Modern UI/UX
- **Dark Mode** – Sleek, eye-friendly dark theme
- **Glassmorphism** – Modern glass-panel design elements
- **Smooth Animations** – Fluid transitions and micro-interactions
- **Responsive Design** – Works seamlessly on all screen sizes
- **NativeWind (Tailwind CSS)** – Utility-first styling for React Native

---

## 🛠 Tech Stack

### Frontend
- **React Native** (Expo) – Cross-platform mobile framework
- **NativeWind** – Tailwind CSS for React Native
- **React Navigation** – Navigation and routing
- **React Native Chart Kit** – Data visualization
- **Expo Linear Gradient** – Gradient effects
- **React Native SVG** – Custom graphics and icons
- **AsyncStorage** – Local data persistence
- **Axios** – HTTP client for API requests

### Backend
- **Django 5.1** – Python web framework
- **Django REST Framework** – RESTful API development
- **PostgreSQL** – Relational database
- **Celery** – Asynchronous task queue
- **Pillow** – Image processing for receipts
- **Google Generative AI (Gemini)** – AI chatbot and OCR
- **JWT Authentication** – Secure token-based auth

### DevOps
- **Docker** – Containerization
- **Docker Compose** – Multi-container orchestration
- **Git** – Version control

---

## 📂 Project Structure

```
kharcha/
├── backend/
│   ├── src/
│   │   ├── apps/
│   │   │   ├── auth/          # User authentication
│   │   │   ├── expense/       # Expense tracking & analytics
│   │   │   ├── budget/        # Budget management
│   │   │   ├── lend/          # Lending & borrowing
│   │   │   ├── event/         # Event budgeting
│   │   │   ├── chatbot/       # AI chatbot integration
│   │   │   ├── notification/  # Push notifications
│   │   │   ├── income/        # Income tracking
│   │   │   ├── remainder/     # Payment reminders
│   │   │   └── common/        # Shared utilities
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── api_urls.py
│   ├── media/                 # Uploaded receipts & images
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── manage.py
│
└── frontend/
    └── kharcha/
        ├── src/
        │   ├── screens/
        │   │   ├── expense/
        │   │   │   ├── InsightsScreen.js
        │   │   │   ├── ReviewExpenseScreen.js
        │   │   │   └── ScanReceiptScreen.js
        │   │   ├── HomeScreen.js
        │   │   ├── GroupsScreen.js
        │   │   ├── LendScreen.js
        │   │   ├── ProfileScreen.js
        │   │   └── ChatbotScreen.js
        │   ├── components/
        │   ├── api/
        │   │   ├── expenseApi.js
        │   │   ├── authApi.js
        │   │   ├── budgetApi.js
        │   │   └── lendApi.js
        │   ├── context/
        │   │   ├── AuthContext.js
        │   │   └── ThemeContext.js
        │   ├── theme/
        │   │   └── designSystem.js
        │   └── utils/
        ├── global.css
        ├── tailwind.config.js
        ├── package.json
        └── App.js
```

---

## ⚙️ Installation & Setup

### 🔹 Prerequisites

Ensure you have the following installed:
- **Node.js** (>= 18.x) – [Download](https://nodejs.org/)
- **npm** or **yarn** – Package manager
- **Python** (>= 3.10) – [Download](https://www.python.org/)
- **Docker** & **Docker Compose** – [Download](https://www.docker.com/)
- **PostgreSQL** (if not using Docker) – [Download](https://www.postgresql.org/)
- **Expo CLI** – `npm install -g expo-cli`

---

### 🔹 Backend Setup (Django + PostgreSQL)

#### Option 1: Using Docker (Recommended)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Build and start containers:**
   ```bash
   docker-compose up --build
   ```

3. **Run migrations:**
   ```bash
   docker-compose exec web python manage.py migrate
   ```

4. **Create superuser:**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

5. **Backend runs at:**
   ```
   http://localhost:8000
   ```

#### Option 2: Manual Setup

1. **Create virtual environment:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure PostgreSQL:**
   - Create a database named `kharcha`
   - Update `DATABASES` in `src/settings.py` with your credentials

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server:**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

---

### 🔹 Frontend Setup (React Native)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend/kharcha
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API endpoint:**
   - Update `API_BASE_URL` in relevant files if needed
   - Default: `http://127.0.0.1:8000`

4. **Start Expo development server:**
   ```bash
   npx expo start -c
   ```

5. **Run on device/emulator:**
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **Web**: Press `w` to open in browser

---

## ▶️ Running the Application

### Quick Start (Recommended)

Use this exact startup routine each time:

#### 1. Start Backend

```bash
cd /home/blackinone/Downloads/kharcha/backend
source .venv/bin/activate

# Optional: Set PostgreSQL environment variables (if using local PostgreSQL)
export DATABASE_HOST=127.0.0.1
export DATABASE_PORT=5432
export DATABASE_NAME=mydb
export DATABASE_USER=myuser
export DATABASE_PASSWORD=mypassword

python manage.py runserver 0.0.0.0:8000
```

#### 2. Start Frontend

```bash
cd /home/blackinone/Downloads/kharcha/frontend/kharcha
source /usr/share/nvm/init-nvm.sh
nvm use 22
npx expo start -c
```

#### 3. Open App

- **Web**: Open the Expo web URL (usually http://localhost:8081)
- **Android Emulator**: Press `a` in Expo terminal
- **iOS Simulator**: Press `i` in Expo terminal
- **Physical Device**: Scan QR code with Expo Go app

### One-Time Setup (Optional)

Add NVM initialization to your `~/.bashrc` so it's always available:

```bash
echo 'source /usr/share/nvm/init-nvm.sh' >> ~/.bashrc
source ~/.bashrc
```

### Convenience Script

For even easier startup, use the provided `run.sh` script in the repo root:

```bash
./run.sh
```

This will start both backend and frontend in separate terminal tabs/windows.

---

## 🔑 Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/kharcha
GEMINI_API_KEY=your-gemini-api-key
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend
Update `API_BASE_URL` in:
- `src/api/expenseApi.js`
- `src/api/authApi.js`
- Other API files as needed

---

## � Key Screens

### Home Dashboard
- Circular spending visualization
- Monthly budget progress
- Recent transactions
- Quick stats (Needs vs Wants)

### Insights & Analytics
- Weekly/Monthly/Yearly views
- Interactive line charts
- Category breakdown
- Spending trends

### Expense Management
- Manual entry form
- Receipt scanning with OCR
- Category selection
- Payment method tracking

### Groups & Splitting
- Create expense groups
- Split bills equally or custom
- Track settlements
- View group history

### Lend & Borrow
- Create lending contracts
- Request/accept loans
- Payment tracking
- Transaction history

---

## 🎨 Design System

### Color Palette
- **Background**: `#09090B` (Dark)
- **Surface**: `#18181B` (Card backgrounds)
- **Accent**: `#2DD4BF` (Teal - Primary actions)
- **Text**: `#FAFAFA` (White)
- **Muted**: `#71717A` (Secondary text)

### Typography
- **Display**: Custom bold fonts for headings
- **Body**: Sans-serif for content
- **Mono**: Monospace for numbers and data

### Components
- Glass-panel cards with blur effects
- Smooth gradients and shadows
- Rounded corners (12-24px)
- Micro-animations on interactions

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register/` – User registration
- `POST /api/auth/login/` – User login
- `POST /api/auth/token/refresh/` – Refresh JWT token

### Expenses
- `GET /api/expenses/` – List expenses (supports filtering by month/year)
- `POST /api/expenses/` – Create expense
- `GET /api/expenses/{id}/` – Get expense details
- `PUT /api/expenses/{id}/` – Update expense
- `DELETE /api/expenses/{id}/` – Delete expense
- `GET /api/analytics/monthly/` – Monthly analytics (supports year param)

### Categories
- `GET /api/categories/` – List categories
- `POST /api/categories/` – Create category

### Groups
- `GET /api/groups/` – List groups
- `POST /api/groups/` – Create group
- `GET /api/expenseshares/` – List shared expenses

### Budgets
- `GET /api/budgets/` – List budgets
- `POST /api/budgets/` – Create budget

---

## 🤖 AI Features

### Receipt OCR
- Upload receipt image
- AI extracts: amount, merchant, date
- Confidence scoring for each field
- Manual review and editing


## 🚀 Future Enhancements

- [ ] Bank account integration
- [ ] Recurring expense automation
- [ ] Export to CSV/PDF
- [ ] Multi-currency support
- [ ] Biometric authentication
- [ ] Offline mode with sync
- [ ] Push notifications
- [ ] Savings goals tracking
- [ ] Investment tracking
- [ ] Tax calculation assistance

---

## 🐛 Known Issues

- Receipt OCR accuracy varies with image quality
- Web version has limited mobile-specific features
- Some animations may lag on older devices

---

## 📄 License

This project is currently unlicensed. All rights reserved.

---

## � Contributing

This is a personal/hackathon project. Contributions are not currently being accepted.

---

## 📧 Contact

For questions or feedback, please open an issue on the repository.

---

**Made with ❤️ for smarter financial management**
