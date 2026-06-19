import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const employeeStatuses = ['Active', 'Inactive'];
const paymentStatuses = ['Pending', 'Paid', 'Cancelled'];
const attendanceStatuses = ['Present', 'Absent', 'Late', 'Half Day', 'Leave'];

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [employees, pendingPayments, paidPayments, attendanceToday] = await Promise.all([
      this.prisma.employee.findMany({ where: { status: 'Active' } }),
      this.prisma.hrPayment.findMany({ where: { status: 'Pending' } }),
      this.prisma.hrPayment.findMany({ where: { status: 'Paid' } }),
      this.prisma.attendanceRecord.findMany({
        where: {
          date: this.normalizedDate(new Date()),
        },
      }),
    ]);

    return {
      activeEmployees: employees.length,
      monthlyPayroll: employees.reduce((sum, employee) => sum + employee.salary, 0),
      pendingPayments: pendingPayments.reduce((sum, payment) => sum + payment.amount, 0),
      paidPayments: paidPayments.reduce((sum, payment) => sum + payment.amount, 0),
      attendanceToday: attendanceToday.reduce(
        (acc, record) => ({ ...acc, [record.status]: (acc[record.status] || 0) + 1 }),
        {},
      ),
    };
  }

  async getEmployees() {
    return this.prisma.employee.findMany({
      orderBy: { fullName: 'asc' },
      include: {
        _count: {
          select: { payments: true, attendance: true },
        },
      },
    });
  }

  async createEmployee(data: any) {
    const employee = await this.prisma.employee.create({
      data: this.toEmployeeData(data),
    });
    return { success: true, employee };
  }

  async updateEmployee(id: number, data: any) {
    const employee = await this.prisma.employee.update({
      where: { id },
      data: this.toEmployeeData(data),
    });
    return { success: true, employee };
  }

  async updateEmployeeStatus(id: number, status: string) {
    if (!employeeStatuses.includes(status)) {
      throw new BadRequestException('Invalid employee status');
    }

    const employee = await this.prisma.employee.update({
      where: { id },
      data: { status },
    });
    return { success: true, employee };
  }

  async getPayments() {
    return this.prisma.hrPayment.findMany({
      orderBy: [{ status: 'asc' }, { dueDate: 'desc' }, { createdAt: 'desc' }],
      include: { employee: true },
    });
  }

  async createPayment(data: any) {
    const payment = await this.prisma.hrPayment.create({
      data: this.toPaymentData(data),
      include: { employee: true },
    });
    return { success: true, payment };
  }

  async updatePaymentStatus(id: number, data: any) {
    if (!paymentStatuses.includes(data.status)) {
      throw new BadRequestException('Invalid payment status');
    }

    const payment = await this.prisma.hrPayment.update({
      where: { id },
      data: {
        status: data.status,
        paidDate: data.status === 'Paid' ? this.dateOrToday(data.paidDate) : null,
        method: data.method?.trim() || undefined,
      },
      include: { employee: true },
    });
    return { success: true, payment };
  }

  async getAttendance() {
    return this.prisma.attendanceRecord.findMany({
      orderBy: [{ date: 'desc' }, { employee: { fullName: 'asc' } }],
      include: { employee: true },
      take: 120,
    });
  }

  async upsertAttendance(data: any) {
    if (!data.employeeId) {
      throw new BadRequestException('Employee is required');
    }
    if (!attendanceStatuses.includes(data.status)) {
      throw new BadRequestException('Invalid attendance status');
    }

    const date = this.normalizedDate(data.date ? new Date(data.date) : new Date());
    const attendance = await this.prisma.attendanceRecord.upsert({
      where: {
        employeeId_date: {
          employeeId: Number(data.employeeId),
          date,
        },
      },
      update: this.toAttendanceData(data, date),
      create: this.toAttendanceData(data, date),
      include: { employee: true },
    });
    return { success: true, attendance };
  }

  private toEmployeeData(data: any) {
    if (!data.fullName || !data.fullName.trim()) {
      throw new BadRequestException('Employee name is required');
    }

    const salary = Number(data.salary) || 0;
    if (salary < 0) {
      throw new BadRequestException('Salary cannot be negative');
    }

    return {
      fullName: data.fullName.trim(),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      role: data.role?.trim() || null,
      department: data.department?.trim() || null,
      salary,
      payFrequency: data.payFrequency || 'Monthly',
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      emergencyContact: data.emergencyContact?.trim() || null,
      notes: data.notes?.trim() || null,
      status: employeeStatuses.includes(data.status) ? data.status : 'Active',
    };
  }

  private toPaymentData(data: any) {
    const amount = Number(data.amount) || 0;
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }
    if (!data.description || !data.description.trim()) {
      throw new BadRequestException('Payment description is required');
    }

    return {
      employeeId: data.employeeId ? Number(data.employeeId) : null,
      type: data.type || 'Other',
      description: data.description.trim(),
      amount,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      paidDate: data.status === 'Paid' ? this.dateOrToday(data.paidDate) : null,
      method: data.method?.trim() || null,
      status: paymentStatuses.includes(data.status) ? data.status : 'Pending',
      notes: data.notes?.trim() || null,
    };
  }

  private toAttendanceData(data: any, date: Date) {
    return {
      employeeId: Number(data.employeeId),
      date,
      status: data.status,
      checkIn: data.checkIn?.trim() || null,
      checkOut: data.checkOut?.trim() || null,
      notes: data.notes?.trim() || null,
    };
  }

  private normalizedDate(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private dateOrToday(value?: string) {
    return value ? new Date(value) : new Date();
  }
}
