import React from 'react';
import { Student, AttendanceRecord, DanceClass } from '../../../../types';
import ProgressDashboard from '../ProgressDashboard';

interface ProgressPageProps {
    student: Student;
    attendanceRecords: AttendanceRecord[];
    allClasses: DanceClass[];
}

const ProgressPage: React.FC<ProgressPageProps> = ({ student, attendanceRecords, allClasses }) => {
    return (
        <div>
            <ProgressDashboard student={student} attendanceRecords={attendanceRecords} allClasses={allClasses} />
        </div>
    );
};

export default ProgressPage;
