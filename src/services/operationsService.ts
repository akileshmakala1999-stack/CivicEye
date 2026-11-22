import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderCompletionEvidence,
  OperationsAuditLog,
  OperationalRole,
  OperationalStaffMember,
  DepartmentInfo,
  DashboardReport,
  IssueSeverity,
} from '../types';
import { reportService } from './reportService';
import { communityValidationService } from './communityValidationService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';

const WORK_ORDERS_STORAGE_KEY = 'civiceye_operations_work_orders';
const AUDIT_LOGS_STORAGE_KEY = 'civiceye_operations_audit_logs';
const ACTIVE_ROLE_STORAGE_KEY = 'civiceye_operations_active_role';
const ACTIVE_STAFF_STORAGE_KEY = 'civiceye_operations_active_staff_id';

export const DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'dept-roads',
    name: 'Roads & Infrastructure Maintenance',
    code: 'GHMC-R&B',
    description: 'Pothole repairs, asphalt resurfacing, arterial flyovers, structural carriageway maintenance.',
    headOfficer: 'Er. S. Venkat Reddy (Executive Engineer)',
    contactNumber: '+91 40 2322 5397',
    defaultSlaHours: { critical: 4, high: 24, medium: 72, low: 168 },
    activeWorkload: 8,
    completedWorkCount: 142,
    onTimePercentage: 94,
  },
  {
    id: 'dept-sanitation',
    name: 'Solid Waste Management & Sanitation',
    code: 'GHMC-SWM',
    description: 'Commercial waste enclosures, bio-hazard clearance, compactor vehicle dispatch, street sweeping.',
    headOfficer: 'Inspector K. Anjaneyulu (Sanitation Supervisor)',
    contactNumber: '+91 40 2322 8411',
    defaultSlaHours: { critical: 4, high: 12, medium: 48, low: 96 },
    activeWorkload: 12,
    completedWorkCount: 310,
    onTimePercentage: 91,
  },
  {
    id: 'dept-water',
    name: 'HMWSSB Water Supply & Sewerage Board',
    code: 'HMWSSB',
    description: 'Drinking water pipeline bursts, valve isolation, waterlogging crossways, hydraulic pressure fixes.',
    headOfficer: 'Assistant Engineer M. Srinivas (Sub-Div VI)',
    contactNumber: '+91 40 2344 2844',
    defaultSlaHours: { critical: 4, high: 24, medium: 48, low: 120 },
    activeWorkload: 5,
    completedWorkCount: 188,
    onTimePercentage: 96,
  },
  {
    id: 'dept-drainage',
    name: 'Stormwater Drain & Flood Control',
    code: 'GHMC-SWD',
    description: 'Underground conduit clearing, storm channel blockage extraction, monsoon culvert restoration.',
    headOfficer: 'Er. P. Nageswara Rao (Supt. Engineer)',
    contactNumber: '+91 40 2322 7100',
    defaultSlaHours: { critical: 4, high: 24, medium: 48, low: 120 },
    activeWorkload: 6,
    completedWorkCount: 95,
    onTimePercentage: 89,
  },
  {
    id: 'dept-electrical',
    name: 'Electrical Wing & Public Lighting',
    code: 'TSSPDCL/GHMC',
    description: 'Streetlight arrays, feeder pillar maintenance, dangling live wires, luminaire replacement.',
    headOfficer: 'Lineman Prakash Rao (Section Officer)',
    contactNumber: '+91 40 2345 1100',
    defaultSlaHours: { critical: 4, high: 18, medium: 48, low: 96 },
    activeWorkload: 4,
    completedWorkCount: 220,
    onTimePercentage: 98,
  },
  {
    id: 'dept-planning',
    name: 'Town Planning & Pedestrian Footpaths',
    code: 'GHMC-TP',
    description: 'Interlocking concrete pavers, pedestrian curb ramps, telecom chamber covers, sidewalk barriers.',
    headOfficer: 'AE Ramesh Chandra (PWD Roads)',
    contactNumber: '+91 40 2322 6620',
    defaultSlaHours: { critical: 12, high: 48, medium: 96, low: 168 },
    activeWorkload: 7,
    completedWorkCount: 114,
    onTimePercentage: 93,
  },
];

export const OPERATIONAL_STAFF: OperationalStaffMember[] = [
  {
    id: 'staff-venkat',
    name: 'Er. S. Venkat Reddy',
    role: 'staff',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Infrastructure Maintenance',
    title: 'Executive Engineer (Khairatabad Zone)',
    activeWorkload: 2,
    completedTasks: 38,
    phone: '+91 98490 12001',
    status: 'on_site',
  },
  {
    id: 'staff-anjaneyulu',
    name: 'Inspector K. Anjaneyulu',
    role: 'staff',
    departmentId: 'dept-sanitation',
    departmentName: 'Solid Waste Management & Sanitation',
    title: 'Sanitation Supervisor (Central Zone)',
    activeWorkload: 3,
    completedTasks: 84,
    phone: '+91 98490 12002',
    status: 'on_site',
  },
  {
    id: 'staff-srinivas',
    name: 'Assistant Engineer M. Srinivas',
    role: 'staff',
    departmentId: 'dept-water',
    departmentName: 'HMWSSB Water Supply & Sewerage Board',
    title: 'Assistant Engineer (Sub-Division VI)',
    activeWorkload: 1,
    completedTasks: 46,
    phone: '+91 98490 12003',
    status: 'available',
  },
  {
    id: 'staff-ramesh',
    name: 'AE Ramesh Chandra',
    role: 'staff',
    departmentId: 'dept-planning',
    departmentName: 'Town Planning & Pedestrian Footpaths',
    title: 'Assistant Engineer (PWD)',
    activeWorkload: 1,
    completedTasks: 29,
    phone: '+91 98490 12004',
    status: 'available',
  },
  {
    id: 'staff-prakash',
    name: 'Lineman Prakash Rao',
    role: 'staff',
    departmentId: 'dept-electrical',
    departmentName: 'Electrical Wing & Public Lighting',
    title: 'Senior Lineman (Gachibowli Substation)',
    activeWorkload: 2,
    completedTasks: 52,
    phone: '+91 98490 12005',
    status: 'available',
  },
  {
    id: 'staff-supervisor-rajesh',
    name: 'Eng. Rajesh Kumar',
    role: 'supervisor',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Infrastructure Maintenance',
    title: 'Senior Executive Operations Supervisor',
    activeWorkload: 6,
    completedTasks: 160,
    phone: '+91 98490 12010',
    status: 'available',
  },
  {
    id: 'staff-reviewer-sunita',
    name: 'Sunita Nair (Reviewer)',
    role: 'reviewer',
    departmentId: 'dept-roads',
    departmentName: 'Central Triage & Intake Desk',
    title: 'Municipal Intake Officer',
    activeWorkload: 14,
    completedTasks: 420,
    phone: '+91 98490 12020',
    status: 'available',
  },
];

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-HYD-2026-0811',
    reportId: 'rep-1',
    reportTicketNumber: 'HYD-JH-2026-081',
    title: 'Deep pothole near Jubilee Hills Road No. 36',
    category: 'Road damage',
    departmentId: 'dept-roads',
    departmentName: 'Roads & Infrastructure Maintenance',
    assignedStaffId: 'staff-venkat',
    assignedStaffName: 'Er. S. Venkat Reddy',
    priority: 'critical',
    status: 'Assigned',
    workDescription:
      'Excavate fractured asphalt sub-base at Peddamma Temple turn, lay hot-mix bitumen binder, compact with pneumatic roller, and level with road threshold.',
    targetCompletionDate: 'Today, 04:00 PM',
    slaTargetHours: 4,
    slaDeadlineTimestamp: Date.now() + 3600000 * 2.5,
    location: 'Near Peddamma Temple Metro Pillar 1420, Road No. 36',
    neighborhood: 'Jubilee Hills',
    createdTimestamp: '18 Nov 2026, 09:45 AM',
    createdAt: Date.now() - 3600000 * 5,
    assignedTimestamp: '18 Nov 2026, 11:30 AM',
    progressNotes: [
      {
        id: 'pn-1',
        timestamp: '18 Nov 2026, 11:35 AM',
        author: 'Sunita Nair (Reviewer)',
        note: 'High vehicular traffic corridor confirmed. Prioritized for immediate morning dispatch.',
      },
    ],
  },
  {
    id: 'WO-HYD-2026-0442',
    reportId: 'rep-2',
    reportTicketNumber: 'HYD-BH-2026-044',
    title: 'Overflowing municipal waste enclosure on Banjara Hills Road No. 12',
    category: 'Garbage',
    departmentId: 'dept-sanitation',
    departmentName: 'Solid Waste Management & Sanitation',
    assignedStaffId: 'staff-anjaneyulu',
    assignedStaffName: 'Inspector K. Anjaneyulu',
    priority: 'high',
    status: 'In Progress',
    workDescription:
      'Deploy 10-ton hydraulic compactor dumper, clear solid commercial and organic waste from 15-meter footpath perimeter, wash pavement with lime bleaching powder.',
    targetCompletionDate: 'Today, 06:00 PM',
    slaTargetHours: 12,
    slaDeadlineTimestamp: Date.now() + 3600000 * 4,
    location: 'Opposite Ministers Quarters Gate, Road No. 12, Banjara Hills',
    neighborhood: 'Banjara Hills',
    createdTimestamp: '16 Nov 2026, 08:00 AM',
    createdAt: Date.now() - 3600000 * 18,
    assignedTimestamp: '16 Nov 2026, 11:30 AM',
    startedTimestamp: '20 Nov 2026, 08:00 AM',
    progressNotes: [
      {
        id: 'pn-21',
        timestamp: '20 Nov 2026, 08:00 AM',
        author: 'Inspector K. Anjaneyulu',
        note: 'Compacting dumper on-site. First load cleared; sanitization team applying bleaching powder.',
      },
    ],
  },
  {
    id: 'WO-HYD-2026-1193',
    reportId: 'rep-3',
    reportTicketNumber: 'HYD-MD-2026-119',
    title: 'Water main rupture causing road erosion near Cyber Towers',
    category: 'Water leakage',
    departmentId: 'dept-water',
    departmentName: 'HMWSSB Water Supply & Sewerage Board',
    assignedStaffId: 'staff-srinivas',
    assignedStaffName: 'Assistant Engineer M. Srinivas',
    priority: 'critical',
    status: 'Accepted',
    workDescription:
      'Isolate feeder valve #12, dig trench to reach 450mm ductile iron pipe, clamp burst joint with heavy-duty mechanical repair sleeve, conduct pressure test.',
    targetCompletionDate: 'Today, 02:00 PM',
    slaTargetHours: 4,
    slaDeadlineTimestamp: Date.now() + 3600000 * 1.5,
    location: 'Cyber Towers Junction, 100 Feet Road, Madhapur',
    neighborhood: 'Madhapur',
    createdTimestamp: '19 Nov 2026, 06:30 PM',
    createdAt: Date.now() - 3600000 * 12,
    assignedTimestamp: '19 Nov 2026, 08:30 PM',
    progressNotes: [
      {
        id: 'pn-31',
        timestamp: '19 Nov 2026, 08:45 PM',
        author: 'Assistant Engineer M. Srinivas',
        note: 'Task accepted. Valve isolation team deployed to reduce main line water flow before trenching.',
      },
    ],
  },
  {
    id: 'WO-HYD-2026-0155',
    reportId: 'rep-5',
    reportTicketNumber: 'HYD-JH-2026-015',
    title: 'Damaged pedestrian pavers and missing utility covers',
    category: 'Damaged footpaths',
    departmentId: 'dept-planning',
    departmentName: 'Town Planning & Pedestrian Footpaths',
    assignedStaffId: 'staff-ramesh',
    assignedStaffName: 'AE Ramesh Chandra',
    priority: 'medium',
    status: 'Completed',
    workDescription:
      'Replace cracked pavers with interlocking 80mm M30 precast blocks. Install heavy-duty cast-iron utility chamber cover with concrete rim reinforcement.',
    targetCompletionDate: '05 Nov 2026, 04:00 PM',
    slaTargetHours: 48,
    slaDeadlineTimestamp: Date.now() - 3600000 * 120,
    location: 'Jubilee Hills Checkpost Junction, Road No. 1 & 36',
    neighborhood: 'Jubilee Hills',
    createdTimestamp: '02 Nov 2026, 11:00 AM',
    createdAt: Date.now() - 3600000 * 180,
    assignedTimestamp: '03 Nov 2026, 11:00 AM',
    startedTimestamp: '04 Nov 2026, 09:30 AM',
    completedTimestamp: '05 Nov 2026, 04:30 PM',
    completionEvidence: {
      workDescription:
        'Completed full pavement alignment and seated precast heavy-duty chamber cover with cement mortar.',
      afterPhotoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f0?auto=format&fit=crop&w=600&q=80',
      materialsUsed: '40 concrete interlocking pavers, 1 cast iron frame, 2 bags cement',
      completedAt: '05 Nov 2026, 04:30 PM',
      submittedByStaffName: 'AE Ramesh Chandra',
      submittedByStaffId: 'staff-ramesh',
      supervisorNotes: 'Inspected on site; work passes municipal civil compliance.',
      supervisorApprovedAt: '05 Nov 2026, 05:00 PM',
    },
    progressNotes: [],
  },
];

const INITIAL_AUDIT_LOGS: OperationsAuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '18 Nov 2026, 11:30 AM',
    createdAt: Date.now() - 3600000 * 5,
    actorId: 'staff-reviewer-sunita',
    actorName: 'Sunita Nair (Reviewer)',
    actorRole: 'reviewer',
    action: 'report_approved',
    entityType: 'report',
    entityId: 'rep-1',
    previousState: 'Submitted',
    newState: 'Assigned',
    reason: 'Verified as critical hazard. Assigned to GHMC Roads division.',
  },
  {
    id: 'aud-2',
    timestamp: '18 Nov 2026, 11:30 AM',
    createdAt: Date.now() - 3600000 * 5,
    actorId: 'staff-reviewer-sunita',
    actorName: 'Sunita Nair (Reviewer)',
    actorRole: 'reviewer',
    action: 'work_order_created',
    entityType: 'work_order',
    entityId: 'WO-HYD-2026-0811',
    newState: 'Assigned',
    reason: 'Rapid pothole cold-mix repair order generated.',
  },
  {
    id: 'aud-3',
    timestamp: '20 Nov 2026, 08:00 AM',
    createdAt: Date.now() - 3600000 * 1,
    actorId: 'staff-anjaneyulu',
    actorName: 'Inspector K. Anjaneyulu',
    actorRole: 'staff',
    action: 'work_order_started',
    entityType: 'work_order',
    entityId: 'WO-HYD-2026-0442',
    previousState: 'Accepted',
    newState: 'In Progress',
    reason: 'Hydraulic compactor and sanitation squad arrived on site.',
  },
];

class OperationsService {
  private workOrders: WorkOrder[] = [];
  private auditLogs: OperationsAuditLog[] = [];
  private activeRole: OperationalRole = 'admin';
  private activeStaffId: string = 'staff-venkat';

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('civiceye_resolution_challenged', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail?.reportId) {
          this.handleCitizenResolutionChallenge(detail);
        }
      });
      window.addEventListener('civiceye_issue_worsening', (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail?.reportId) {
          const wo = this.workOrders.find((w) => w.reportId === detail.reportId);
          if (wo && wo.priority !== 'critical') {
            const oldPriority = wo.priority;
            wo.priority = wo.priority === 'low' ? 'medium' : 'high';
            this.recordAuditLog({
              actorId: detail.userName || 'citizen',
              actorName: detail.userName || 'Community Citizen',
              actorRole: 'citizen',
              action: 'report_reclassified',
              entityType: 'work_order',
              entityId: wo.id,
              previousState: oldPriority,
              newState: wo.priority,
              reason: `Escalated due to citizen worsening report: ${detail.note || 'Hazard accelerating.'}`,
            });
            this.saveToStorage();
          }
        }
      });
    }
  }

  private loadFromStorage() {
    try {
      const savedOrders = localStorage.getItem(WORK_ORDERS_STORAGE_KEY);
      this.workOrders = savedOrders ? JSON.parse(savedOrders) : INITIAL_WORK_ORDERS;

      const savedLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      this.auditLogs = savedLogs ? JSON.parse(savedLogs) : INITIAL_AUDIT_LOGS;

      const savedRole = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY) as OperationalRole;
      if (savedRole) this.activeRole = savedRole;

      const savedStaffId = localStorage.getItem(ACTIVE_STAFF_STORAGE_KEY);
      if (savedStaffId) this.activeStaffId = savedStaffId;
    } catch (e) {
      console.warn('Failed to load operations state from localStorage', e);
      this.workOrders = INITIAL_WORK_ORDERS;
      this.auditLogs = INITIAL_AUDIT_LOGS;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(WORK_ORDERS_STORAGE_KEY, JSON.stringify(this.workOrders));
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(this.auditLogs));
      localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, this.activeRole);
      localStorage.setItem(ACTIVE_STAFF_STORAGE_KEY, this.activeStaffId);

      window.dispatchEvent(new CustomEvent('civiceye_operations_updated'));
    } catch (e) {
      console.error('Failed to save operations state to localStorage', e);
    }
  }

  // 1. Role & Identity Management
  getActiveRole(): OperationalRole {
    const authSession = authService.getCurrentSessionSync();
    if (authSession?.user?.user_metadata?.role === 'citizen') {
      return 'citizen';
    }
    return this.activeRole;
  }

  setActiveRole(role: OperationalRole): void {
    const authSession = authService.getCurrentSessionSync();
    if (authSession?.user?.user_metadata?.role === 'citizen' && role !== 'citizen') {
      console.warn('[Security] Unauthorized attempt to elevate role while logged in as citizen. Fails closed.');
      this.activeRole = 'citizen';
      this.saveToStorage();
      return;
    }
    this.activeRole = role;
    this.saveToStorage();
  }

  getActiveStaffId(): string {
    return this.activeStaffId;
  }

  getActiveStaff(): OperationalStaffMember | undefined {
    return OPERATIONAL_STAFF.find((s) => s.id === this.activeStaffId);
  }

  setActiveStaffId(staffId: string): void {
    this.activeStaffId = staffId;
    this.saveToStorage();
  }

  getCurrentOperator(): {
    id: string;
    name: string;
    role: OperationalRole;
    title: string;
    department: string;
  } {
    const authSession = authService.getCurrentSessionSync();
    if (authSession?.user?.user_metadata?.role === 'citizen') {
      return {
        id: authSession.user.id,
        name: authSession.user.user_metadata.full_name || 'Citizen User',
        role: 'citizen',
        title: authSession.user.user_metadata.title || 'Community Citizen',
        department: 'Citizen Public',
      };
    }

    const role = this.getActiveRole();
    if (role === 'admin') {
      return {
        id: 'usr-admin-director',
        name: 'Director P. Seshadri, IAS',
        role: 'admin',
        title: 'Municipal Commissioner & Director of Operations',
        department: 'GHMC Central Administration',
      };
    }
    if (role === 'supervisor') {
      const sup = OPERATIONAL_STAFF.find((s) => s.role === 'supervisor') || OPERATIONAL_STAFF[0];
      return {
        id: sup.id,
        name: sup.name,
        role: 'supervisor',
        title: sup.title,
        department: sup.departmentName,
      };
    }
    if (role === 'reviewer') {
      const rev = OPERATIONAL_STAFF.find((s) => s.role === 'reviewer') || OPERATIONAL_STAFF[0];
      return {
        id: rev.id,
        name: rev.name,
        role: 'reviewer',
        title: rev.title,
        department: rev.departmentName,
      };
    }
    if (role === 'staff') {
      const staff = OPERATIONAL_STAFF.find((s) => s.id === this.activeStaffId) || OPERATIONAL_STAFF[0];
      return {
        id: staff.id,
        name: staff.name,
        role: 'staff',
        title: staff.title,
        department: staff.departmentName,
      };
    }
    return {
      id: 'usr-aditya',
      name: 'Aditya (Citizen Guardian)',
      role: 'citizen',
      title: 'Community Watch Level 3',
      department: 'Ward 93 Public',
    };
  }

  canPerform(action: string): boolean {
    const authSession = authService.getCurrentSessionSync();
    // Fail-closed authorization: Citizen sessions can never perform operational mutations
    if (authSession?.user?.user_metadata?.role === 'citizen') {
      return false;
    }

    const role = this.getActiveRole();
    if (role === 'admin') return true;

    switch (action) {
      case 'view_operations':
      case 'view_review_queue':
      case 'approve_report':
      case 'reject_report':
      case 'mark_duplicate':
      case 'request_info':
        return role === 'reviewer' || role === 'supervisor';
      case 'assign_work':
      case 'reassign_work':
        return role === 'supervisor';
      case 'accept_task':
      case 'start_task':
      case 'add_progress_note':
      case 'mark_blocked':
      case 'submit_completion':
        return role === 'staff';
      case 'review_completion':
      case 'approve_completion':
      case 'return_rework':
        return role === 'supervisor';
      case 'manage_system':
      case 'audit_log':
        return role === 'supervisor';
      default:
        return false;
    }
  }

  // 2. Review Queue: Approve, Reject, Reclassify, Duplicate
  async approveReportForAssignment(params: {
    reportId: string;
    departmentId: string;
    assignedStaffId?: string;
    priority?: IssueSeverity;
    targetHours?: number;
    assignmentNotes?: string;
  }): Promise<{ success: boolean; workOrder: WorkOrder; message: string }> {
    if (!this.canPerform('approve_report')) {
      throw new Error('Unauthorized: Operator lacks permission to approve reports.');
    }
    const operator = this.getCurrentOperator();
    const dept = DEPARTMENTS.find((d) => d.id === params.departmentId) || DEPARTMENTS[0];
    const defaultStaff = OPERATIONAL_STAFF.find((s) => s.departmentId === dept.id);
    const staff = params.assignedStaffId
      ? OPERATIONAL_STAFF.find((s) => s.id === params.assignedStaffId)
      : defaultStaff;

    const reports = await reportService.getAllReports();
    const reportIndex = reports.findIndex((r) => r.id === params.reportId);

    if (reportIndex < 0) {
      throw new Error(`Report with ID ${params.reportId} not found.`);
    }

    const report = reports[reportIndex];
    const targetHours = params.targetHours || dept.defaultSlaHours[params.priority || report.severity] || 24;
    const nowTime = Date.now();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update report in reportService and persist across all layers
    await reportService.updateReportStatus(
      params.reportId,
      'Assigned',
      `Approved by ${operator.name}. Dispatched to ${dept.name} (${staff ? staff.name : 'Pending Team Slot'}). Note: ${params.assignmentNotes || 'Standard dispatch order.'}`,
      dept.name,
      staff ? staff.name : dept.headOfficer,
      params.priority || report.severity
    );

    // Check if work order already exists or create new
    let wo = this.workOrders.find((w) => w.reportId === params.reportId);
    if (!wo) {
      const randId = Math.floor(1000 + Math.random() * 9000);
      wo = {
        id: `WO-HYD-2026-${randId}`,
        reportId: report.id,
        reportTicketNumber: report.ticketNumber,
        title: report.title,
        category: report.category,
        departmentId: dept.id,
        departmentName: dept.name,
        assignedStaffId: staff ? staff.id : undefined,
        assignedStaffName: staff ? staff.name : undefined,
        priority: params.priority || report.severity,
        status: staff ? 'Assigned' : 'Pending Assignment',
        workDescription: params.assignmentNotes || `Field resolution for ${report.title} located at ${report.location}.`,
        targetCompletionDate: new Date(nowTime + targetHours * 3600000).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        slaTargetHours: targetHours,
        slaDeadlineTimestamp: nowTime + targetHours * 3600000,
        location: report.location,
        neighborhood: report.neighborhood,
        createdTimestamp: nowStr,
        createdAt: nowTime,
        assignedTimestamp: nowStr,
        version: 1,
        progressNotes: [
          {
            id: `pn-${Date.now()}`,
            timestamp: nowStr,
            author: operator.name,
            note: `Work order dispatched to ${dept.name}. SLA Target: ${targetHours}h.`,
          },
        ],
      };
      this.workOrders.unshift(wo);
    } else {
      wo.departmentId = dept.id;
      wo.departmentName = dept.name;
      wo.assignedStaffId = staff ? staff.id : wo.assignedStaffId;
      wo.assignedStaffName = staff ? staff.name : wo.assignedStaffName;
      wo.status = 'Assigned';
    }

    // Log audit events
    this.recordAuditLog({
      actorId: operator.id,
      actorName: operator.name,
      actorRole: operator.role,
      action: 'report_approved',
      entityType: 'report',
      entityId: report.id,
      previousState: report.status,
      newState: 'Assigned',
      reason: `Assigned to ${dept.name} by ${operator.name}.`,
    });

    this.recordAuditLog({
      actorId: operator.id,
      actorName: operator.name,
      actorRole: operator.role,
      action: 'work_order_created',
      entityType: 'work_order',
      entityId: wo.id,
      newState: wo.status,
      reason: `Work order created for ticket ${report.ticketNumber}.`,
    });

    // Notify citizens / followers
    window.dispatchEvent(
      new CustomEvent('civiceye_new_notification', {
        detail: {
          id: `notif-${Date.now()}`,
          title: `Report Assigned to ${dept.name}`,
          message: `Ticket ${report.ticketNumber} was officially approved and assigned for field execution.`,
          time: 'Just now',
          read: false,
          type: 'assignment',
          relatedReportId: report.id,
        },
      })
    );

    this.saveToStorage();
    return { success: true, workOrder: wo, message: `Report approved and Work Order ${wo.id} issued.` };
  }

  async rejectReport(params: {
    reportId: string;
    reason: string;
    rejectionCategory?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (!this.canPerform('reject_report')) {
      throw new Error('Unauthorized: Operator lacks permission to reject reports.');
    }
    const operator = this.getCurrentOperator();
    const reports = await reportService.getAllReports();
    const reportIndex = reports.findIndex((r) => r.id === params.reportId);

    if (reportIndex < 0) throw new Error('Report not found');
    const report = reports[reportIndex];

    await reportService.updateReportStatus(
      params.reportId,
      'Resolved',
      `Administrative review rejection by ${operator.name}. Reason: ${params.reason}`
    );

    this.recordAuditLog({
      actorId: operator.id,
      actorName: operator.name,
      actorRole: operator.role,
      action: 'report_rejected',
      entityType: 'report',
      entityId: report.id,
      previousState: report.status,
      newState: 'Rejected',
      reason: params.reason,
    });

    window.dispatchEvent(
      new CustomEvent('civiceye_new_notification', {
        detail: {
          id: `notif-${Date.now()}`,
          title: 'Report Intake Assessment Update',
          message: `Ticket ${report.ticketNumber} was reviewed: ${params.reason}`,
          time: 'Just now',
          read: false,
          type: 'status_update',
          relatedReportId: report.id,
        },
      })
    );

    this.saveToStorage();
    return { success: true, message: `Report ${report.ticketNumber} marked as rejected.` };
  }

  // 3. Work Order State Transitions
  transitionWorkOrderStatus(params: {
    workOrderId: string;
    newStatus: WorkOrderStatus;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): { success: boolean; workOrder?: WorkOrder; error?: string } {
    const operator = this.getCurrentOperator();
    const wo = this.workOrders.find((w) => w.id === params.workOrderId);
    if (!wo) return { success: false, error: 'Work order not found.' };

    const currentStatus = wo.status;
    const targetStatus = params.newStatus;

    // VALID STATE TRANSITION MATRIX
    const validTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      'Pending Assignment': ['Assigned', 'Accepted', 'In Progress', 'Cancelled'],
      'Assigned': ['Accepted', 'In Progress', 'Pending Assignment', 'Cancelled'],
      'Accepted': ['In Progress', 'Blocked', 'Cancelled'],
      'In Progress': ['Blocked', 'Submitted for Review', 'Cancelled'],
      'Blocked': ['In Progress', 'Cancelled'],
      'Submitted for Review': ['Completed', 'Returned for Rework', 'Cancelled'],
      'Returned for Rework': ['In Progress', 'Cancelled'],
      'Completed': [], // Terminal
      'Cancelled': [], // Terminal
    };

    if (!validTransitions[currentStatus]?.includes(targetStatus)) {
      return {
        success: false,
        error: `Invalid transition: cannot move work order from "${currentStatus}" to "${targetStatus}".`,
      };
    }

    // Role-based permission checks
    if (targetStatus === 'Accepted' || targetStatus === 'In Progress') {
      if (operator.role === 'citizen') return { success: false, error: 'Citizens cannot execute work orders.' };
    }
    if (targetStatus === 'Completed' || targetStatus === 'Returned for Rework') {
      if (operator.role !== 'supervisor' && operator.role !== 'admin') {
        return { success: false, error: 'Only Supervisors and Admins can approve completion or return work orders for rework.' };
      }
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    wo.status = targetStatus;
    wo.version = (wo.version || 1) + 1;

    if (targetStatus === 'Accepted') {
      wo.assignedStaffId = operator.id;
      wo.assignedStaffName = operator.name;
    } else if (targetStatus === 'In Progress') {
      wo.startedTimestamp = nowStr;
      this.syncReportStatus(wo.reportId, 'In Progress', `Work squad (${wo.assignedStaffName || operator.name}) started on-site repairs.`);
    } else if (targetStatus === 'Blocked') {
      wo.blockedTimestamp = nowStr;
      wo.blockedReason = params.reason || 'Operational impediment on site.';
    } else if (targetStatus === 'Completed') {
      wo.completedTimestamp = nowStr;
      this.syncReportStatus(
        wo.reportId,
        'Resolved',
        `Repairs completed and officially signed off by supervisor ${operator.name}. Transferred to citizen verification.`
      );
      // Automatically register verification event
      communityValidationService.verifyResolutionSatisfactory(wo.reportId, operator.id, operator.name);
    } else if (targetStatus === 'Returned for Rework') {
      wo.reworkNotes = params.reason || 'Completion evidence insufficient or repair substandard.';
    } else if (targetStatus === 'Cancelled') {
      wo.cancellationReason = params.reason || 'Cancelled by administrative order.';
    }

    if (params.reason) {
      wo.progressNotes.push({
        id: `pn-${Date.now()}`,
        timestamp: nowStr,
        author: operator.name,
        note: `[Status Change to ${targetStatus}]: ${params.reason}`,
      });
    }

    // Record audit log
    this.recordAuditLog({
      actorId: operator.id,
      actorName: operator.name,
      actorRole: operator.role,
      action:
        targetStatus === 'In Progress'
          ? 'work_order_started'
          : targetStatus === 'Blocked'
          ? 'work_order_blocked'
          : targetStatus === 'Completed'
          ? 'completion_approved'
          : targetStatus === 'Returned for Rework'
          ? 'rework_returned'
          : 'work_order_assigned',
      entityType: 'work_order',
      entityId: wo.id,
      previousState: currentStatus,
      newState: targetStatus,
      reason: params.reason,
    });

    this.saveToStorage();
    return { success: true, workOrder: wo };
  }

  // 4. Staff Field Actions
  addProgressNote(workOrderId: string, note: string, photoUrl?: string): boolean {
    const operator = this.getCurrentOperator();
    const wo = this.workOrders.find((w) => w.id === workOrderId);
    if (!wo) return false;

    wo.progressNotes.unshift({
      id: `pn-${Date.now()}`,
      timestamp: 'Just now',
      author: operator.name,
      note,
      photoUrl,
    });

    this.recordAuditLog({
      actorId: operator.id,
      actorName: operator.name,
      actorRole: operator.role,
      action: 'evidence_submitted',
      entityType: 'work_order',
      entityId: wo.id,
      newState: wo.status,
      reason: `Progress note added: "${note.slice(0, 40)}..."`,
    });

    this.saveToStorage();
    return true;
  }

  submitCompletionEvidence(params: {
    workOrderId: string;
    afterPhotoUrl: string;
    workDescription: string;
    materialsUsed?: string;
    beforePhotoUrl?: string;
  }): { success: boolean; error?: string } {
    if (!this.canPerform('submit_completion')) {
      return { success: false, error: 'Unauthorized: Staff permissions required to submit completion evidence.' };
    }
    const operator = this.getCurrentOperator();
    const wo = this.workOrders.find((w) => w.id === params.workOrderId);
    if (!wo) return { success: false, error: 'Work order not found.' };

    const evidence: WorkOrderCompletionEvidence = {
      beforePhotoUrl: params.beforePhotoUrl,
      afterPhotoUrl: params.afterPhotoUrl,
      workDescription: params.workDescription,
      materialsUsed: params.materialsUsed,
      completedAt: 'Just now',
      submittedByStaffName: operator.name,
      submittedByStaffId: operator.id,
    };

    wo.completionEvidence = evidence;
    return this.transitionWorkOrderStatus({
      workOrderId: params.workOrderId,
      newStatus: 'Submitted for Review',
      reason: 'Field squad completed work; submitted for supervisor sign-off.',
    });
  }

  // 5. Supervisor Review Actions
  approveCompletion(workOrderId: string, supervisorNotes?: string): { success: boolean; error?: string } {
    if (!this.canPerform('approve_completion')) {
      return { success: false, error: 'Unauthorized: Supervisor permissions required to approve completion.' };
    }
    const wo = this.workOrders.find((w) => w.id === workOrderId);
    if (!wo) return { success: false, error: 'Work order not found.' };

    if (wo.completionEvidence) {
      wo.completionEvidence.supervisorNotes = supervisorNotes || 'Work inspected and approved as satisfactory.';
      wo.completionEvidence.supervisorApprovedAt = 'Just now';
    }

    return this.transitionWorkOrderStatus({
      workOrderId,
      newStatus: 'Completed',
      reason: supervisorNotes || 'Supervisor approved field completion proof.',
    });
  }

  returnForRework(workOrderId: string, reworkNotes: string): { success: boolean; error?: string } {
    if (!this.canPerform('return_rework')) {
      return { success: false, error: 'Unauthorized: Supervisor permissions required to return work orders for rework.' };
    }
    return this.transitionWorkOrderStatus({
      workOrderId,
      newStatus: 'Returned for Rework',
      reason: reworkNotes,
    });
  }

  // Helper: Synchronize with reportService and database
  public async syncReportStatus(reportId: string, status: DashboardReport['status'], note: string) {
    try {
      await reportService.updateReportStatus(reportId, status, note);
    } catch (e) {
      console.warn('Could not sync report status', e);
    }
  }

  // Handle citizen challenge / reopen trigger directly in operations
  handleCitizenResolutionChallenge(params: {
    reportId: string;
    citizenName: string;
    citizenId?: string;
    reason: string;
    photoUrl?: string;
  }): boolean {
    const { reportId, citizenName, citizenId = 'usr-current-citizen', reason } = params;
    const wo = this.workOrders.find((w) => w.reportId === reportId);

    if (wo) {
      wo.status = 'Returned for Rework';
      wo.progressNotes.unshift({
        id: `pn-ch-${Date.now()}`,
        timestamp: 'Just now',
        author: citizenName,
        note: `[Citizen Challenge & Reopen Trigger] ${reason}`,
        photoUrl: params.photoUrl,
      });

      this.recordAuditLog({
        actorId: citizenId,
        actorName: citizenName,
        actorRole: 'citizen',
        action: 'rework_returned',
        entityType: 'work_order',
        entityId: wo.id,
        previousState: 'Completed',
        newState: 'Returned for Rework',
        reason: `Citizen challenged resolution quality. Work order reopened for rework: "${reason.slice(0, 80)}"`,
      });
    }

    // Synchronize report status to Under Review with timeline step
    void this.syncReportStatus(
      reportId,
      'Under Review',
      `Citizen challenged resolution quality. Ticket reopened for inspection and rework. Reason: ${reason}`
    );

    this.saveToStorage();
    return true;
  }

  // 6. Metrics & SLA Calculations
  calculateOverallSlaMetrics(): {
    totalEvaluated: number;
    completedOnTime: number;
    completedLate: number;
    activeOnSchedule: number;
    activeOverdue: number;
    blockedCount: number;
    cancelledCount: number;
    complianceRate: number; // percentage 0-100
  } {
    const validOrders = this.workOrders.filter((w) => w.status !== 'Cancelled');
    const now = Date.now();

    let completedOnTime = 0;
    let completedLate = 0;
    let activeOnSchedule = 0;
    let activeOverdue = 0;
    let blockedCount = 0;
    const cancelledCount = this.workOrders.filter((w) => w.status === 'Cancelled').length;

    for (const wo of validOrders) {
      const deadline =
        wo.slaDeadlineTimestamp ||
        (wo.createdAt ? wo.createdAt + (wo.slaTargetHours || 24) * 3600000 : 0);

      if (wo.status === 'Completed') {
        // If explicitly recorded as late in completion evidence or notes
        const isLate =
          deadline > 0 &&
          wo.completionEvidence &&
          (wo.completedTimestamp?.toLowerCase().includes('late') ||
            (wo.completionEvidence.supervisorNotes?.toLowerCase().includes('delay') &&
              !wo.completionEvidence.supervisorNotes?.toLowerCase().includes('no delay')));

        if (isLate) {
          completedLate++;
        } else {
          completedOnTime++;
        }
      } else if (wo.status === 'Blocked') {
        blockedCount++;
      } else {
        // Active orders: Assigned, Accepted, In Progress, Submitted for Review, Returned for Rework
        if (deadline > 0 && now > deadline) {
          activeOverdue++;
        } else {
          activeOnSchedule++;
        }
      }
    }

    // Total evaluated orders includes all valid completed, active, and blocked orders (excluding cancelled)
    // Blocked orders have an officially paused SLA clock due to approved external dependencies.
    // They are held under 'Paused Compliance' and are not penalized as overdue.
    const totalEvaluated = completedOnTime + completedLate + activeOnSchedule + activeOverdue + blockedCount;
    const compliantCount = completedOnTime + activeOnSchedule + blockedCount;
    const complianceRate =
      totalEvaluated > 0 ? Math.round((compliantCount / totalEvaluated) * 100) : 100;

    return {
      totalEvaluated,
      completedOnTime,
      completedLate,
      activeOnSchedule,
      activeOverdue,
      blockedCount,
      cancelledCount,
      complianceRate,
    };
  }

  getOperationsMetrics() {
    const totalOrders = this.workOrders.length;
    const activeOrders = this.workOrders.filter(
      (w) =>
        w.status === 'In Progress' ||
        w.status === 'Accepted' ||
        w.status === 'Assigned' ||
        w.status === 'Returned for Rework'
    ).length;
    const blockedOrders = this.workOrders.filter((w) => w.status === 'Blocked').length;
    const pendingReviewOrders = this.workOrders.filter((w) => w.status === 'Submitted for Review').length;
    const completedOrders = this.workOrders.filter((w) => w.status === 'Completed').length;

    const slaMetrics = this.calculateOverallSlaMetrics();

    return {
      totalOrders,
      activeOrders,
      blockedOrders,
      pendingReviewOrders,
      completedOrders,
      overdueOrders: slaMetrics.activeOverdue,
      slaComplianceRate: slaMetrics.complianceRate,
    };
  }

  calculateSlaStatus(workOrder: WorkOrder): {
    status: 'on_schedule' | 'approaching' | 'overdue' | 'blocked' | 'cancelled';
    hoursRemaining: number;
    label: string;
  } {
    if (workOrder.status === 'Cancelled') {
      return { status: 'cancelled', hoursRemaining: 0, label: 'Work Order Cancelled' };
    }

    if (workOrder.status === 'Blocked') {
      return {
        status: 'blocked',
        hoursRemaining: 0,
        label: workOrder.blockedReason
          ? `Blocked: ${workOrder.blockedReason.slice(0, 24)}...`
          : 'Temporarily Blocked (Paused)',
      };
    }

    const deadline =
      workOrder.slaDeadlineTimestamp ||
      (workOrder.createdAt ? workOrder.createdAt + (workOrder.slaTargetHours || 24) * 3600000 : 0);

    if (workOrder.status === 'Completed') {
      const isLate =
        deadline > 0 &&
        (workOrder.completedTimestamp?.toLowerCase().includes('late') ||
          (workOrder.completionEvidence?.supervisorNotes?.toLowerCase().includes('delay') &&
            !workOrder.completionEvidence?.supervisorNotes?.toLowerCase().includes('no delay')));

      return {
        status: isLate ? 'overdue' : 'on_schedule',
        hoursRemaining: 0,
        label: isLate ? 'Completed Past SLA' : 'Completed On Time',
      };
    }

    if (!deadline) {
      return { status: 'on_schedule', hoursRemaining: 0, label: 'Standard Schedule (No SLA Set)' };
    }

    const now = Date.now();
    const diffHours = (deadline - now) / 3600000;

    if (diffHours < 0) {
      const overdueHours = Math.abs(Math.round(diffHours));
      return { status: 'overdue', hoursRemaining: diffHours, label: `${overdueHours}h Overdue` };
    } else if (diffHours < 2) {
      return { status: 'approaching', hoursRemaining: diffHours, label: '< 2h Remaining' };
    } else {
      return { status: 'on_schedule', hoursRemaining: diffHours, label: `${Math.round(diffHours)}h Remaining` };
    }
  }

  // 7. Get Data Queries
  getDepartments(): DepartmentInfo[] {
    return [...DEPARTMENTS];
  }

  getWorkOrders(): WorkOrder[] {
    return [...this.workOrders];
  }

  getWorkOrderById(id: string): WorkOrder | undefined {
    return this.workOrders.find((w) => w.id === id);
  }

  getWorkOrderByReportId(reportId: string): WorkOrder | undefined {
    return this.workOrders.find((w) => w.reportId === reportId);
  }

  getStaffWorkOrders(staffId: string): WorkOrder[] {
    const staff = OPERATIONAL_STAFF.find((s) => s.id === staffId);
    return this.workOrders.filter(
      (w) => w.assignedStaffId === staffId || (!w.assignedStaffId && staff && w.departmentId === staff.departmentId)
    );
  }

  getAuditLogs(): OperationsAuditLog[] {
    return [...this.auditLogs].sort((a, b) => b.createdAt - a.createdAt);
  }

  recordAuditLog(entry: Omit<OperationsAuditLog, 'id' | 'timestamp' | 'createdAt'>) {
    const log: OperationsAuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      createdAt: Date.now(),
    };
    this.auditLogs.unshift(log);

    // Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      void Promise.resolve(
        supabase.from('operations_audit_logs').insert({
          actor_id: log.actorId,
          actor_name: log.actorName,
          actor_role: log.actorRole,
          action: log.action,
          entity_type: log.entityType,
          entity_id: log.entityId,
          previous_state: log.previousState,
          new_state: log.newState,
          reason: log.reason,
        })
      ).catch((err: unknown) => console.warn('Supabase audit log sync error:', err));
    }
  }

  /**
   * Non-destructive removal of work orders for a specific report (used for demo scenario resets)
   */
  removeWorkOrderForReport(reportId: string): boolean {
    const beforeCount = this.workOrders.length;
    this.workOrders = this.workOrders.filter((w) => w.reportId !== reportId);
    if (this.workOrders.length !== beforeCount) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Upsert a work order directly into operations state (used for scenario initialization)
   */
  upsertWorkOrder(wo: WorkOrder): WorkOrder {
    const existingIndex = this.workOrders.findIndex((w) => w.id === wo.id || w.reportId === wo.reportId);
    if (existingIndex >= 0) {
      this.workOrders[existingIndex] = { ...this.workOrders[existingIndex], ...wo };
    } else {
      this.workOrders.unshift(wo);
    }
    this.saveToStorage();
    return wo;
  }
}

export const operationsService = new OperationsService();
