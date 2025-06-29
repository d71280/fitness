-- CreateTable
CREATE TABLE "programs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "color_class" TEXT NOT NULL DEFAULT 'bg-blue-500',
    "text_color_class" TEXT NOT NULL DEFAULT 'text-white',
    "default_duration" INTEGER NOT NULL DEFAULT 60,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "instructors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "specialties" TEXT NOT NULL,
    "bio" TEXT,
    "profile_image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "studios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "equipment" TEXT NOT NULL,
    "description" TEXT,
    "operating_hours" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "recurring_group_id" TEXT,
    "recurring_type" TEXT,
    "recurring_end_date" DATETIME,
    "recurring_count" INTEGER,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancellation_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "program_id" INTEGER NOT NULL,
    "instructor_id" INTEGER NOT NULL,
    "studio_id" INTEGER NOT NULL,
    CONSTRAINT "schedules_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "schedules_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "schedules_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "line_id" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "membership_type" TEXT NOT NULL DEFAULT 'regular',
    "preferred_programs" TEXT NOT NULL,
    "cancellation_count" INTEGER NOT NULL DEFAULT 0,
    "last_booking_date" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "booking_type" TEXT NOT NULL DEFAULT 'advance',
    "cancellation_reason" TEXT,
    "cancelled_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    CONSTRAINT "reservations_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reservations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "waiting_list" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "position" INTEGER NOT NULL,
    "notified_at" DATETIME,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schedule_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    CONSTRAINT "waiting_list_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "waiting_list_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "notification_type" TEXT NOT NULL,
    "message_content" TEXT NOT NULL,
    "sent_at" DATETIME,
    "lstep_response" TEXT,
    "success" BOOLEAN NOT NULL,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customer_id" INTEGER NOT NULL,
    "reservation_id" INTEGER,
    CONSTRAINT "notification_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notification_logs_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admins" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_name_key" ON "programs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_date_studio_id_start_time_end_time_key" ON "schedules"("date", "studio_id", "start_time", "end_time");

-- CreateIndex
CREATE UNIQUE INDEX "customers_line_id_key" ON "customers"("line_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_schedule_id_customer_id_key" ON "reservations"("schedule_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "waiting_list_schedule_id_customer_id_key" ON "waiting_list"("schedule_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
