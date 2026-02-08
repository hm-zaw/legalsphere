import { Briefcase, FileText, LucideIcon, UserPlus, Users, Calendar, ClipboardCheck } from "lucide-react";

export type OverviewCardData = {
  title: string;
  value: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const overviewData: OverviewCardData[] = [
  {
    title: 'Open Cases',
    value: '32',
    description: 'Cases  currently in progress',
    href: '/case-files',
    icon: FileText,
  },
  {
    title: 'Upcoming Bookings ',
    value: '4',
    description: 'Client appointments scheduled',
    href: '/bookings',
    icon: Calendar,
  },
  {
    title: 'Pending Tasks',
    value: '3',
    description: 'Tasks requiring your attention',
    href: '/tasks',
    icon: ClipboardCheck,
  },
  {
    title: 'New Clients',
    value: '15',
    description: '+5 this month',
    href: '/applications',
    icon: UserPlus,
  },
];

export const recentActivitiesData = [
  {
    id: 1,
    case: 'Case #2024-045',
    action: 'filed a new motion',
    actor: 'You',
    time: '2 hours ago',
  },
  {
    id: 2,
    case: 'Case #2023-112',
    action: 'document was signed by client',
    actor: 'John Smith',
    time: '5 hours ago',
  },
  {
    id: 3,
    case: 'New Client',
    action: 'added to the system',
    actor: 'Jane Doe',
    time: 'Yesterday',
  },
  {
    id: 4,
    case: 'Case #2024-007',
    action: 'hearing has been scheduled',
    actor: 'System',
    time: '2 days ago',
  },
    {
    id: 5,
    case: 'Case #2023-098',
    action: 'sent a settlement offer',
    actor: 'You',
    time: '3 days ago',
  },
];


export type Appointment = {
  client: string;
  avatar: string;
  purpose: string;
  date: string;
  time: string;
};

export const upcomingAppointmentsData: Appointment[] = [
    {
        client: 'Michael Scott',
        avatar: 'https://picsum.photos/seed/lawyer1/100/100',
        purpose: 'Initial Consultation',
        date: 'June 25, 2024',
        time: '10:00 AM'
    },
    {
        client: 'Dwight Schrute',
        avatar: 'https://picsum.photos/seed/lawyer2/100/100',
        purpose: 'Deposition Prep',
        date: 'June 25, 2024',
        time: '2:00 PM'
    },
    {
        client: 'Pam Beesly',
        avatar: 'https://picsum.photos/seed/lawyer3/100/100',
        purpose: 'Document Review',
        date: 'June 26, 2024',
        time: '11:30 AM'
    },
    {
        client: 'Jim Halpert',
        avatar: 'https://picsum.photos/seed/lawyer4/100/100',
        purpose: 'Case Strategy',
        date: 'June 27, 2024',
        time: '9:00 AM'
    }
];

export type Task = {
  id: string;
  case: string;
  clientName: string;
  description: string;
  dueDate: string;
  status: 'Pending' | 'Completed';
  icon: LucideIcon;
};

export const tasksData: Task[] = [
    {
        id: 'TASK-8782',
        case: 'Case #2024-045',
        clientName: 'Michael Scott',
        description: 'Review and sign the new motion for summary judgment.',
        dueDate: '2 days',
        status: 'Pending',
        icon: FileText
    },
    {
        id: 'TASK-5214',
        case: 'Case #2023-112',
        clientName: 'Dwight Schrute',
        description: 'Prepare for the deposition of the opposing party\'s expert witness.',
        dueDate: '5 days',
        status: 'Pending',
        icon: Users
    },
    {
        id: 'TASK-9833',
        case: 'New Client Intake',
        clientName: 'Acme Corp.',
        description: 'Finalize engagement letter for Acme Corp.',
        dueDate: '1 week',
        status: 'Pending',
        icon: Briefcase
    }
];

export type Booking = {
  id: number;
  client: string;
  purpose: string;
  date: string;
  time: string;
  avatar: string;
};

export const bookingsData: Booking[] = [
  {
    id: 1,
    client: 'Alice Johnson',
    purpose: 'Case Consultation',
    date: 'February 20, 2026',
    time: '2:30 PM',
    avatar: 'https://picsum.photos/seed/booking1/100/100',
  },
  {
    id: 2,
    client: 'Bob Williams',
    purpose: 'Document Signing',
    date: 'February 25, 2026',
    time: '11:00 AM',
    avatar: 'https://picsum.photos/seed/booking2/100/100',
  },
  {
    id: 3,
    client: 'Charlie Brown',
    purpose: 'Follow-up',
    date: 'February 25, 2026',
    time: '3:00 PM',
    avatar: 'https://picsum.photos/seed/booking3/100/100',
  },
  {
    id: 4,
    client: 'Diana Prince',
    purpose: 'Initial Retainer',
    date: 'February 27, 2026',
    time: '10:00 AM',
    avatar: 'https://picsum.photos/seed/booking4/100/100',
  },
];

export type Notification = {
    id: number;
    title: string;
    description: string;
    time: string;
    read: boolean;
};

export const notificationsData: Notification[] = [
    {
        id: 1,
        title: 'New message from Michael Scott',
        description: 'I need to declare bankruptcy.',
        time: '5m ago',
        read: false,
    },
    {
        id: 2,
        title: 'Case #2024-007 Updated',
        description: 'A new document was uploaded by the opposing counsel.',
        time: '1h ago',
        read: false,
    },
    {
        id: 3,
        title: 'Upcoming Appointment',
        description: 'Deposition Prep with Dwight Schrute in 2 hours.',
        time: '1h ago',
        read: true,
    },
    {
        id: 4,
        title: 'Document Signed',
        description: 'Pam Beesly signed the engagement letter.',
        time: 'Yesterday',
        read: true,
    },
];


export type CaseFile = {
  id: string;
  clientName: string;
  status: 'Active' | 'Closed' | 'Pending';
  lastUpdated: string;
  description: string;
};

export const caseFilesData: CaseFile[] = [
  {
    id: '#2024-046',
    clientName: 'Angela Martin',
    status: 'Pending',
    lastUpdated: '1 day ago',
    description: 'Review of the prenuptial agreement for a high-profile client. Requires attention to detail regarding asset division and confidentiality clauses.',
  },
  {
    id: '#2024-045',
    clientName: 'Michael Scott',
    status: 'Active',
    lastUpdated: '2 hours ago',
    description: 'Corporate litigation case involving a breach of contract with a major paper supplier. Key evidence includes email correspondence and witness testimonies.',
  },
  {
    id: '#2023-112',
    clientName: 'Dwight Schrute',
    status: 'Active',
    lastUpdated: '5 hours ago',
    description: 'Real estate dispute over the ownership of a beet farm. Involves complex property laws and historical land deeds.',
  },
  {
    id: '#2024-007',
    clientName: 'Pam Beesly',
    status: 'Closed',
    lastUpdated: '2 days ago',
    description: 'Intellectual property case for an independent artist. Successfully secured copyright protection for a series of illustrations.',
  },
  {
    id: '#2023-098',
    clientName: 'Jim Halpert',
    status: 'Active',
    lastUpdated: '3 days ago',
    description: 'Startup consultation for a new sports marketing company. Providing legal advice on business formation, contracts, and compliance.',
  },
  {
    id: '#2022-019',
    clientName: 'Kevin Malone',
    status: 'Closed',
    lastUpdated: '1 month ago',
    description: 'Handled a small claims court case for a client regarding a dispute with a local venue. The case was settled out of court.',
  },
];


export type Client = {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar: string;
};

export const clientsData: Client[] = [
    {
        id: 1,
        name: 'Michael Scott',
        email: 'michael.scott@dundermifflin.com',
        phone: '+1 (570) 123-4567',
        avatar: 'https://picsum.photos/seed/lawyer1/100/100',
    },
    {
        id: 2,
        name: 'Dwight Schrute',
        email: 'dwight.schrute@dundermifflin.com',
        phone: '+1 (570) 234-5678',
        avatar: 'https://picsum.photos/seed/lawyer2/100/100',
    },
    {
        id: 3,
        name: 'Pam Beesly',
        email: 'pam.beesly@dundermifflin.com',
        phone: '+1 (570) 345-6789',
        avatar: 'https://picsum.photos/seed/lawyer3/100/100',
    },
    {
        id: 4,
        name: 'Jim Halpert',
        email: 'jim.halpert@dundermifflin.com',
        phone: '+1 (570) 456-7890',
        avatar: 'https://picsum.photos/seed/lawyer4/100/100',
    },
    {
        id: 5,
        name: 'Andy Bernard',
        email: 'andy.bernard@dundermifflin.com',
        phone: '+1 (570) 567-8901',
        avatar: 'https://picsum.photos/seed/lawyer5/100/100',
    },
];

export const analyticsData = {
  caseVolume: [
    { month: 'Jan', cases: 12 },
    { month: 'Feb', cases: 19 },
    { month: 'Mar', cases: 15 },
    { month: 'Apr', cases: 22 },
    { month: 'May', cases: 18 },
    { month: 'Jun', cases: 25 },
  ],
  billableHours: [
    { month: 'Jan', hours: 120 },
    { month: 'Feb', hours: 140 },
    { month: 'Mar', hours: 130 },
    { month: 'Apr', hours: 160 },
    { month: 'May', hours: 150 },
    { month: 'Jun', hours: 170 },
  ],
  revenue: [
     { name: 'Consultation', value: 400, fill: 'hsl(var(--chart-1))' },
     { name: 'Litigation', value: 300, fill: 'hsl(var(--chart-2))' },
     { name: 'Contracts', value: 300, fill: 'hsl(var(--chart-3))' },
     { name: 'Real Estate', value: 200, fill: 'hsl(var(--chart-4))' },
  ]
};


