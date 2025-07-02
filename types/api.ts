export interface Schedule {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  programId: number;
  capacity: number;
  program?: Program;
  currentBookings?: number;
  availableSlots?: number;
  bookedCount?: number;
}

export interface CreateScheduleData {
  date: string;
  startTime: string;
  endTime: string;
  programId: number;
  capacity: number;
  repeat: 'none' | 'weekly' | 'monthly';
}

export interface CreateReservationData {
  scheduleId: number;
  customerNameKanji: string;
  customerNameKatakana: string;
  lineId: string;
  phone: string;
  experienceDate?: string;
  timeSlot?: string;
  programName?: string;
}

export interface Program {
  id: number;
  name: string;
  description?: string;
  duration: number;
  capacity: number;
  color: string;
  color_class: string;
  text_color_class: string;
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
  scheduleId: number;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  reservedAt: string;
  schedule?: Schedule;
  customer?: Customer;
  status?: string;
  created_at?: string;
}

export interface CreateRecurringScheduleData {
  date: string;
  startTime: string;
  endTime: string;
  programId: number;
  capacity: number;
  repeatWeeks: number;
  daysOfWeek: number[];
}

export interface UpdateScheduleData {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  programId: number;
  capacity: number;
}