import React from 'react';
import { Student, AttendanceRecord } from '../../../../types';
import ProgressDashboard from '../ProgressDashboard';

interface ProgressPageProps {
    student: Student;
    attendanceRecords: AttendanceRecord[];
}

const ProgressPage: React.FC<ProgressPageProps> = ({ student, attendanceRecords }) => {
    return (
        <div>
            <ProgressDashboard student={student} attendanceRecords={attendanceRecords} />
        </div>
    );
};

export default ProgressPage;
