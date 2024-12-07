import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from './Loading';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './css/Payment.css';


const Payment = () => {
    const location = useLocation();
    const { state } = location;
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [amount, setAmount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null); // เก็บ URL สำหรับแสดงตัวอย่างไฟล์
    const [countdownInterval, setCountdownInterval] = useState(null);
    const navigate = useNavigate();


    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        const previewUrl = URL.createObjectURL(selectedFile);
        setFilePreview(previewUrl);
    };

    if (!state) {
        return <Loading />;
    }
    console.log(state);

    const handlePayment = async () => {
        if (!state || !state.timeUsed) return;
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/payment/generate-qrcode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ timeUsed: state.timeUsed }),
            });

            if (response.ok) {
                const data = await response.json();
                setAmount(data.amount);
                setQrCodeUrl(data.qrCodeUrl);
                setLoading(false);
                resetCountdown();
            } else {
                console.error('เกิดข้อผิดพลาดในการสร้าง QR Code');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    const resetCountdown = () => {
        if (countdownInterval) clearInterval(countdownInterval);

        setTimeLeft(300);
        const newInterval = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(newInterval);
                    setQrCodeUrl(null);
                    Swal.fire({
                        title: 'หมดเวลา',
                        text: 'QR Code หมดอายุ กรุณาจองใหม่อีกครั้ง',
                        icon: 'warning',
                        confirmButtonText: 'ตกลง',
                    }).then(() => {

                        navigate('/booking');
                    });

                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        setCountdownInterval(newInterval);
    };


    useEffect(() => {
        return () => {
            if (countdownInterval) clearInterval(countdownInterval);
            if (filePreview) URL.revokeObjectURL(filePreview); // ล้าง URL ของไฟล์เมื่อ component นี้ถูกทำลาย
        };
    }, [countdownInterval, filePreview]);

    const handleFileUpload = async () => {
        if (!file) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: `กรุณาแนบสลีปโอนเงินก่อน`,
                icon: 'warning',
                confirmButtonText: 'ลองอีกครั้ง',
            });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('amount', amount);

        try {
            const response = await fetch('http://localhost:3001/api/payment/upload-slip', {
                method: 'POST',
                body: formData,
            });

            const responseData = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: 'จองสำเร็จ',
                    text: `${responseData.message}`,
                    icon: 'success',
                    confirmButtonText: 'ตกลง',
                }).then(() => {
                    handlePaymentSuccess();
                    navigate('/ticket');
                });
            } else {
                Swal.fire({
                    title: 'จองไม่สำเร็จ',
                    text: `${responseData.message}`,
                    icon: 'warning',
                    confirmButtonText: 'ลองอีกครั้ง',
                });
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handlePaymentSuccess = async () => {
        try {
            const bookingData = {
                ...state
            };

            const response = await fetch('http://localhost:3001/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData), // ส่งข้อมูลการจองรวมถึง phone ไปยัง backend
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'ชำระเงินสำเร็จ',
                    text: 'การจองของคุณได้บันทึกเรียบร้อย',
                });
                // อาจนำผู้ใช้ไปยังหน้าอื่นหลังบันทึกสำเร็จ
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สามารถบันทึกการจองได้',
                    text: 'โปรดลองใหม่อีกครั้ง',
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ ลองอีกครั้งภายหลัง',
            });
        }
    };

    const handlePaymentClick = () => {
        if (qrCodeUrl && timeLeft > 0) {
            Swal.fire({
                title: 'QR Code ยังใช้งานได้',
                text: `กรุณาชำระเงินให้เสร็จสิ้นภายในเวลาที่กำหนด (${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')})`,
                icon: 'info',
                confirmButtonText: 'ตกลง',
            });
        } else {
            handlePayment(); // เรียกฟังก์ชันสร้าง QR Code
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };


    return (
        <div className="payment-form">
            <h2>ข้อมูลการจอง</h2>
            <table>
                <tbody>
                    <tr>
                        <th>สนาม</th>
                        <td>{state.field}</td>
                    </tr>
                    <tr>
                        <th>วันที่</th>
                        <td>{formatDate(state.date)}</td>
                    </tr>
                    <tr>
                        <th>เวลาเริ่ม</th>
                        <td>{state.startTime}</td>
                    </tr>
                    <tr>
                        <th>เวลาสิ้นสุด</th>
                        <td>{state.endTime}</td>
                    </tr>
                    <tr>
                        <th>เวลาที่ใช้</th>
                        <td>{state.timeUsed} ชั่วโมง</td>
                    </tr>
                </tbody>
            </table>

            <button
                onClick={handlePaymentClick}
                className="submit-btn"
                disabled={loading}
            >
                {loading ? 'กำลังสร้าง QR Code...' : 'สร้าง QR code'}
            </button>


            {qrCodeUrl && timeLeft > 0 ? (
                <div className="qr-code-section">
                    <h3>ชำระเงิน {amount} บาท</h3>
                    <p>กรุณาชำระภายใน {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} นาที</p>
                    <img src={qrCodeUrl} alt="QR Code สำหรับชำระเงิน" />
                    <p><br />เมื่อชำระเสร็จแล้วให้กดปุ่มแนบสลีปด้านล่าง</p>
                </div>
            ) : qrCodeUrl && timeLeft === 0 ? (
                <p>QR Code หมดอายุแล้ว กรุณาสร้างใหม่</p>
            ) : null}

            <div className="upload-section">
                {qrCodeUrl && timeLeft > 0 && (
                    <>
                        <input type="file" onChange={handleFileChange} accept="image/*" />
                        {filePreview && <img src={filePreview} alt="ตัวอย่างสลิป" className="file-preview" />}
                        <button onClick={handleFileUpload} className="submit-btn">
                            แนบสลิปและส่ง
                        </button>
                    </>
                )}
            </div>

        </div>
    );
};

export default Payment;
