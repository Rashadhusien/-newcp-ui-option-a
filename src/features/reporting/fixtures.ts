/**
 * PROVISIONAL local fixtures for the report layout (A5 pulled ahead of the
 * contract). Invented data only: no real client, clinic or patient.
 *
 * Replaced by contract-shaped mocks in `src/mocks/` when A2.3 resumes
 * (DEVIATIONS D-13). Order ORD-2041 deliberately has two Models instances,
 * so the report shows two rows for it (counted by instance).
 *
 * A18 (D-71): statuses are the API status codes the mock workflow uses
 * (`submitted`, `in_design`, `on_hold`, ...), so each one gets its own tone
 * and icon from shared/status; the old display labels ("In Progress")
 * were unknown codes and all fell back to grey.
 */

import type { ReportRow } from './types';

export const REPORT_FIXTURES: readonly ReportRow[] = [
  { serviceId: 'SVC-5001', orderId: 'o-2041', orderNumber: 'ORD-2041', client: 'Mock Dental Studio A', patientCode: 'PT-0101', serviceType: 'models', status: 'submitted', option: 'Study model', arch: 'Upper', quantity: 1, dueDate: '2026-10-27', priority: 'Rush' },
  { serviceId: 'SVC-5002', orderId: 'o-2041', orderNumber: 'ORD-2041', client: 'Mock Dental Studio A', patientCode: 'PT-0101', serviceType: 'models', status: 'in_design', option: 'Working model', arch: 'Lower', quantity: 1, dueDate: '2026-10-28', priority: 'Normal' },
  { serviceId: 'SVC-5003', orderId: 'o-2041', orderNumber: 'ORD-2041', client: 'Mock Dental Studio A', patientCode: 'PT-0101', serviceType: 'conversion', status: 'pending_information', option: 'STL export', arch: 'Both', quantity: 1, dueDate: '2026-10-29', priority: 'Normal' },
  { serviceId: 'SVC-5004', orderId: 'o-2042', orderNumber: 'ORD-2042', client: 'Sample Ortho Clinic B', patientCode: 'PT-0102', serviceType: 'models', status: 'shipped', option: 'Study model', arch: 'Both', quantity: 2, dueDate: '2026-10-30', priority: 'Normal' },
  { serviceId: 'SVC-5005', orderId: 'o-2043', orderNumber: 'ORD-2043', client: 'Test Smile Center C', patientCode: 'PT-0103', serviceType: 'conversion', status: 'in_production', option: 'STL export', arch: 'Upper', quantity: 1, dueDate: '2026-10-26', priority: 'Rush' },
  { serviceId: 'SVC-5006', orderId: 'o-2044', orderNumber: 'ORD-2044', client: 'Sample Ortho Clinic B', patientCode: 'PT-0104', serviceType: 'models', status: 'completed', option: 'Working model', arch: 'Upper', quantity: 1, dueDate: '2026-10-22', priority: 'Normal' },
  { serviceId: 'SVC-5007', orderId: 'o-2045', orderNumber: 'ORD-2045', client: 'Demo Implant Lab D', patientCode: 'PT-0105', serviceType: 'conversion', status: 'delivered', option: 'Custom format', arch: 'Lower', quantity: 1, dueDate: '2026-10-23', priority: 'Normal' },
  { serviceId: 'SVC-5008', orderId: 'o-2046', orderNumber: 'ORD-2046', client: 'Mock Dental Studio A', patientCode: 'PT-0106', serviceType: 'models', status: 'in_design', option: 'Study model', arch: 'Lower', quantity: 1, dueDate: '2026-11-02', priority: 'Normal' },
  { serviceId: 'SVC-5009', orderId: 'o-2047', orderNumber: 'ORD-2047', client: 'Test Smile Center C', patientCode: 'PT-0107', serviceType: 'conversion', status: 'on_hold', option: 'STL export', arch: 'Both', quantity: 1, dueDate: '2026-11-03', priority: 'Rush' },
  { serviceId: 'SVC-5010', orderId: 'o-2048', orderNumber: 'ORD-2048', client: 'Demo Implant Lab D', patientCode: 'PT-0108', serviceType: 'models', status: 'submitted', option: 'Working model', arch: 'Both', quantity: 2, dueDate: '2026-11-04', priority: 'Normal' },
  { serviceId: 'SVC-5011', orderId: 'o-2049', orderNumber: 'ORD-2049', client: 'Sample Ortho Clinic B', patientCode: 'PT-0109', serviceType: 'conversion', status: 'in_production', option: 'Custom format', arch: 'Upper', quantity: 1, dueDate: '2026-11-05', priority: 'Normal' },
  { serviceId: 'SVC-5012', orderId: 'o-2050', orderNumber: 'ORD-2050', client: 'Mock Dental Studio A', patientCode: 'PT-0110', serviceType: 'models', status: 'completed', option: 'Study model', arch: 'Upper', quantity: 1, dueDate: '2026-10-21', priority: 'Normal' },
  { serviceId: 'SVC-5013', orderId: 'o-2051', orderNumber: 'ORD-2051', client: 'Test Smile Center C', patientCode: 'PT-0111', serviceType: 'models', status: 'shipped', option: 'Working model', arch: 'Lower', quantity: 1, dueDate: '2026-11-06', priority: 'Rush' },
  { serviceId: 'SVC-5014', orderId: 'o-2052', orderNumber: 'ORD-2052', client: 'Demo Implant Lab D', patientCode: 'PT-0112', serviceType: 'conversion', status: 'delivered', option: 'STL export', arch: 'Both', quantity: 1, dueDate: '2026-10-24', priority: 'Normal' },
];
