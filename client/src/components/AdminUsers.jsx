import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Paper, Typography, TextField, Box, Modal } from '@mui/material';
import Swal from 'sweetalert2'; // นำเข้า SweetAlert2
import './css/AdminUsers.css';
import Loading from './Loading';
import { useNavigate } from 'react-router-dom';
import EditUserModal from './EditUserModal';
const apiUrl = import.meta.env.VITE_API_URL;

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [admin, setAdmin] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null); // ผู้ใช้ที่ถูกเลือกสำหรับแก้ไข
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const navigate = useNavigate();
    const handleOpenEditModal = (user) => {
        setSelectedUser(user);
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setSelectedUser(null);
        setEditModalOpen(false);
    };

    const handleUpdateUser = (updatedUser) => {
        setUsers((prevUsers) => prevUsers.map(user =>
            user.id === updatedUser.id ? updatedUser : user
        ));
        setFilteredUsers((prevFilteredUsers) => prevFilteredUsers.map(user =>
            user.id === updatedUser.id ? updatedUser : user
        ));
    }

    const verify = (is_verified) => {
        return is_verified === 1 ? 'ยืนยันตัวตนแล้ว' : 'ยังไม่ได้ยืนยันตัวตน';
    };

    useEffect(() => {
        const savedAdmin = JSON.parse(localStorage.getItem('adminData'));
        if (savedAdmin) {
            setAdmin(savedAdmin);
        } else {
            <Loading />
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่มีToken โปรดลองอีกครั้ง',
            }).then(() => navigate('/'));
        }

        axios.get(`${apiUrl}/api/admin/users`)
            .then(response => {
                setUsers(response.data);
                setFilteredUsers(response.data);
            })
            .catch(error => {
                console.error('Error fetching users:', error);
            });
    }, []);

    if (!Array.isArray(filteredUsers)) {
        return <div className='no-user'>ไม่พบข้อมูลผู้ใช้</div>;
    }

    // ฟังก์ชันลบผู้ใช้
    const handleDelete = (id) => {
        Swal.fire({
            title: 'คุณต้องการลบผู้ใช้งานนี้หรือไม่?',
            text: 'ข้อมูลที่ลบแล้วจะไม่สามารถกู้คืนได้!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                // ลบผู้ใช้จากระบบ
                axios.delete(`${apiUrl}/api/admin/users/${id}`)
                    .then(() => {
                        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
                        setFilteredUsers((prevFilteredUsers) =>
                            prevFilteredUsers.filter((user) => user.id !== id)
                        );
                        Swal.fire(
                            'ลบแล้ว!',
                            'ผู้ใช้งานถูกลบเรียบร้อยแล้ว.',
                            'success'
                        );
                    })
                    .catch((error) => {
                        Swal.fire(
                            'เกิดข้อผิดพลาด!',
                            'ไม่สามารถลบผู้ใช้งานได้.',
                            'error'
                        );
                        console.error('Error deleting user:', error);
                    });
            }
        });
    };


    const formatDate = (date) => {
        return new Date(date).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        });
    };

    const handleSearch = (event) => {
        const value = event.target.value;
        setSearchTerm(value);

        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(value.toLowerCase()) ||
            user.email.toLowerCase().includes(value.toLowerCase()) ||
            user.phone.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredUsers(filtered);
    };

    return (
        <div className="admin-users-container-wrapper">
            <div className="admin-users-overlay"></div>
                <Container maxWidth="lg" sx={{ mt: 20 }}>
                    <Typography variant="h4" align="center" sx={{ mb: 4, fontWeight: 'bold', color: '#1976d2' }}>จัดการข้อมูลผู้ใช้งาน</Typography>
                    <Box sx={{ mb: 3, }}>
                        <TextField
                            inputProps={{ style: { padding: '20px' } }}
                            placeholder="ค้นหาผู้ใช้งาน"
                            variant="outlined"
                            fullWidth
                            onChange={handleSearch}
                            sx={{
                                boxShadow: 3,
                                borderRadius: "8px",
                            }}
                        />
                    </Box>
                    <TableContainer component={Paper} sx={{ 
                        borderRadius: 3, boxShadow: 3 }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#1976d2', color: '#fff' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>ชื่อ</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>เบอร์</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>วันที่สมัคร</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>ยืนยันตัวตน</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'black' }}>จัดการ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map(user => (
                                    <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone}</TableCell>
                                        <TableCell>{formatDate(user.created_at)}</TableCell>
                                        <TableCell>{verify(user.is_verified)}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleOpenEditModal(user)}
                                                sx={{ borderRadius: "20px", marginRight: 2 }}
                                            >
                                                แก้ไข
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                onClick={() => handleDelete(user.id)}
                                                sx={{
                                                    backgroundColor: '#d32f2f',
                                                    borderRadius: "20px"
                                                }}
                                            >
                                                ลบ
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {selectedUser && (
                        <EditUserModal
                            open={isEditModalOpen}
                            onClose={handleCloseEditModal}
                            user={selectedUser}
                            onUpdate={handleUpdateUser}
                        />
                    )}
                </Container>
            </div>
    );
};

export default AdminUsers;
