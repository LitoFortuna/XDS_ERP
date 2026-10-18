import React from 'react';
import { Student, AttendanceRecord, DanceClass, DanceEvent, MerchandiseSale } from '../../../../types';
import ProgressDashboard from '../ProgressDashboard';

interface ProgressPageProps {
    student: Student;
    attendanceRecords: AttendanceRecord[];
    allClasses: DanceClass[];
    events?: DanceEvent[];
    sales?: MerchandiseSale[];
}

const ProgressPage: React.FC<ProgressPageProps> = ({ student, attendanceRecords, allClasses, events, sales }) => {
    return (
        <div>
            <ProgressDashboard student={student} attendanceRecords={attendanceRecords} allClasses={allClasses} events={events} sales={sales} />
        </div>
    );
};

export default ProgressPage;
