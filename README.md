# Dormsy - Modern Hostel Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)

**Dormsy** is a comprehensive digital hostel management platform that streamlines operations for administrators, wardens, and students. Built with modern web technologies, it offers seamless management of student records, attendance tracking, mess operations, fee management, and more.

## 🌟 Features

### For Administrators
- **College & Hostel Management**: Create and manage multiple colleges and hostels
- **Room Management**: Configure rooms, floors, and capacity
- **Warden Assignment**: Assign wardens to specific hostels
- **Fee Management**: Set up and track hostel fees
- **System Analytics**: Real-time dashboard with key metrics
- **Data Export**: Export data in CSV/Excel formats
- **Audit Logs**: Track all system activities
- **Email Notifications**: Automated notification system
- **User Management**: Manage all user roles and permissions
- **System Health Monitoring**: Monitor database and system status

### For Wardens
- **Student Management**: Add, edit, and manage student records
- **Attendance Tracking**: Daily room attendance and mess attendance
- **Complaint Resolution**: Review and resolve student complaints
- **Leave Approvals**: Approve/reject student leave requests
- **Mess Menu Management**: Create and update weekly mess menus
- **Hostel Rules Management**: Define and update hostel rules
- **Visitor Management**: Track and manage hostel visitors
- **Fine Management**: Issue and track fines

### For Students
- **Personal Dashboard**: View personal and guardian information
- **Complaint System**: Submit and track complaints
- **Leave Requests**: Submit leave requests with approval tracking
- **Fee Records**: View fee details and payment history
- **Mess Menu**: View weekly mess menu
- **Mess Attendance**: Mark daily mess attendance via QR code
- **Hostel Rules**: Access hostel rules and regulations
- **QR Code**: Personal QR code for various operations
- **Visitor Management**: Register and track visitors
- **Fines**: View and pay fines
- **Payment History**: Complete payment transaction history

## 🚀 Technology Stack

- **Frontend**: React 18.3, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form, Zod validation
- **Payments**: Stripe integration
- **QR Code**: qrcode, qr-scanner libraries
- **Charts**: Recharts
- **PDF Generation**: jsPDF, html2canvas

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (for backend services)
- Stripe account (for payment processing)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd dormsy
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**

The project is connected to Supabase. Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `STRIPE_SECRET_KEY`: Your Stripe secret key (configured in Supabase secrets)

4. **Start development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
```

## 📁 Project Structure

```
dormsy/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin panel components
│   │   ├── warden/         # Warden dashboard components
│   │   ├── student/        # Student dashboard components
│   │   ├── common/         # Shared components
│   │   └── ui/             # shadcn/ui components
│   ├── contexts/           # React contexts (Auth)
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route pages
│   ├── integrations/       # External integrations (Supabase)
│   └── lib/                # Utilities
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
└── public/                 # Static assets
```

## 🔐 Authentication & Authorization

Dormsy uses Supabase Auth with role-based access control (RBAC):
- **Admin**: Full system access
- **Warden**: Hostel management capabilities
- **Student**: Personal dashboard and services

Row Level Security (RLS) policies ensure data isolation and security.

## 🗄️ Database Schema

The system uses 17+ tables including:
- `profiles`: User profile data
- `colleges`: College information
- `hostels`: Hostel details
- `rooms`: Room management
- `students`: Student records
- `wardens`: Warden assignments
- `attendance`: Daily attendance tracking
- `mess_attendance`: Mess attendance records
- `complaints`: Student complaints
- `leave_requests`: Leave applications
- `fines`: Fine management
- `payments`: Payment transactions
- And more...

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check
```

## 🚢 Deployment

Quick deploy via Lovable:
1. Open [Lovable Project](https://lovable.dev/projects/6af98b0f-413a-44eb-9263-5f1af9743ae0)
2. Click "Share" → "Publish"

## 🔍 Code Quality & Audits

The project has undergone comprehensive audits:
- ✅ Accessibility (WCAG 2.1 AA compliant)
- ✅ SEO optimized (meta tags, structured data)
- ✅ Performance optimized
- ✅ Security hardened (RLS policies, input validation)
- ✅ TypeScript strict mode enabled
- ✅ ESLint configured

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Stripe](https://stripe.com/) for payment processing
- [Lovable](https://lovable.dev/) for the development platform

## 📞 Support

For support, email support@dormsy.com or join our community Discord.

## 🔗 Links

- **Live Demo**: [https://dormsy.lovable.app](https://dormsy.lovable.app)
- **Documentation**: [https://docs.dormsy.com](https://docs.dormsy.com)
- **Project URL**: [Lovable Project](https://lovable.dev/projects/6af98b0f-413a-44eb-9263-5f1af9743ae0)

---

Made with ❤️ by the Dormsy team
