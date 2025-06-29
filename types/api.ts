export interface Schedule {
  id: number;
  time: string;
  program: string;
  instructor: string;
  studio: string;
  capacity: number;
  booked: number;
  color: string;
  textColor: string;
}

export interface CreateScheduleData {
  baseDate: string;
  startTime: string;
  endTime: string;
  programId: number;
  instructorId: number;
  studioId: number;
  capacity: number;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatEndDate?: string;
  repeatCount?: number;
}

export interface CreateReservationData {
  scheduleId: number;
  customerName: string;
  lineId: string;
  phone?: string;
}

export interface Program {
  id: number;
  name: string;
  color_class: string;
  text_color_class: string;
  default_duration: number;
  description?: string;
  default_instructor_id?: number;
}

export interface Instructor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  specialties: string[];
  bio?: string;
}

export interface Customer {
  id: number;
  name: string;
  line_id?: string;
  phone?: string;
  email?: string;
  membership_type: string;
}

export interface Studio {
  id: number;
  name: string;
  capacity: number;
  equipment: string[];
  description?: string;
}

export interface Reservation {
  id: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  schedule_id: number;
  customer_id: number;
  customer?: Customer;
  schedule?: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    program?: Program;
    instructor?: Instructor;
    studio?: Studio;
  };
}