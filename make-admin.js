/* ตั้งผู้ใช้เป็นผู้ดูแลระบบ: npm run make-admin -- <รหัสนักศึกษา> */
const { db } = require("./db");

const studentId = process.argv[2];
if (!studentId) {
  console.log("วิธีใช้: npm run make-admin -- <รหัสนักศึกษา>");
  process.exit(1);
}

const { changes } = db.prepare("UPDATE users SET role = 'admin', banned = 0 WHERE student_id = ?").run(studentId);
console.log(changes
  ? `ตั้ง ${studentId} เป็นผู้ดูแลระบบแล้ว`
  : `ไม่พบรหัสนักศึกษา ${studentId} (ต้องสมัครสมาชิกบนเว็บก่อน)`);
