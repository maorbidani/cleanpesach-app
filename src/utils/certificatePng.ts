import { FamilyMember } from '../types';

export function downloadCertificateAsPng(params: {
  memberStats: Array<{
    member: FamilyMember;
    completedCount: number;
    points: number;
  }>;
  totalPoints: number;
  overallPercentage: number;
  lockedRooms: number;
  totalRooms: number;
}): void {
  const {
    memberStats,
    totalPoints,
    overallPercentage,
    lockedRooms,
    totalRooms,
  } = params;

  const width = 1200;
  const rowHeight = 58;
  const extraHeight = Math.max(0, memberStats.length - 3) * rowHeight;
  const height = 860 + extraHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background (Warm Cream)
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, width, height);

  // Outer Soft Gold Border
  ctx.strokeStyle = '#D49A3A';
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // Inner Sage Hairline Border
  ctx.strokeStyle = '#5E8C7D';
  ctx.lineWidth = 2;
  ctx.strokeRect(44, 44, width - 88, height - 88);

  // Top Gold Badge Pill
  ctx.fillStyle = '#F6EBD2';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 140, 82, 280, 40, 20);
  ctx.fill();

  ctx.fillStyle = '#9B6816';
  ctx.font = 'bold 20px Rubik, Assistant, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('קליןפסח · CleanPesach', width / 2, 109);

  // Main Title
  ctx.fillStyle = '#2D312E';
  ctx.font = 'bold 48px Rubik, Assistant, sans-serif';
  ctx.fillText('תעודת הצטיינות – הבית מוכן לפסח!', width / 2, 190);

  // Summary Subtitle
  ctx.fillStyle = '#456B5E';
  ctx.font = '600 24px Assistant, sans-serif';
  ctx.fillText(
    `התקדמות: ${overallPercentage}%  ·  ${lockedRooms} מתוך ${totalRooms} חדרים נקיים מחמץ  ·  ${totalPoints} נקודות`,
    width / 2,
    242
  );

  // Divider
  ctx.strokeStyle = '#E0DAD0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(140, 278);
  ctx.lineTo(width - 140, 278);
  ctx.stroke();

  // Section Header: Family Participants
  ctx.fillStyle = '#2D312E';
  ctx.font = 'bold 26px Rubik, Assistant, sans-serif';
  ctx.fillText('גיבורי הניקיון של המשפחה', width / 2, 326);

  // Member Cards List
  let y = 362;
  for (const stat of memberStats) {
    ctx.fillStyle = '#EFECE6';
    ctx.beginPath();
    ctx.roundRect(140, y, width - 280, 48, 14);
    ctx.fill();

    // Right side (RTL): Name + Role
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2D312E';
    ctx.font = 'bold 22px Assistant, sans-serif';
    ctx.fillText(
      `${stat.member.name} (${stat.member.role})`,
      width - 170,
      y + 31
    );

    // Left side (RTL): Completed & Points
    ctx.textAlign = 'left';
    ctx.fillStyle = '#456B5E';
    ctx.font = 'bold 21px Assistant, sans-serif';
    ctx.fillText(
      `${stat.completedCount} משימות  ·  ★ ${stat.points} נק׳`,
      170,
      y + 31
    );

    y += rowHeight;
  }

  // Blessing Box
  const blessingY = y + 26;
  ctx.fillStyle = '#DFE9E4';
  ctx.beginPath();
  ctx.roundRect(120, blessingY, width - 240, 145, 20);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#2D312E';
  ctx.font = 'bold 24px Rubik, Assistant, sans-serif';
  ctx.fillText('חג אביב שמח וכשר!', width / 2, blessingY + 46);

  ctx.fillStyle = '#3B4640';
  ctx.font = '21px Assistant, sans-serif';
  ctx.fillText(
    'יהי רצון שתזכו לשבת אל שולחן ליל הסדר בבית מואר ונקי,',
    width / 2,
    blessingY + 88
  );
  ctx.fillText(
    'בלב שקט, בשמחה משפחתית ובחירות אמיתית.',
    width / 2,
    blessingY + 118
  );

  // Date Stamp
  ctx.fillStyle = '#5A605C';
  ctx.font = '18px Assistant, sans-serif';
  const dateLabel = new Date().toLocaleDateString('he-IL');
  ctx.fillText(`הופק באפליקציית קליןפסח · ${dateLabel}`, width / 2, height - 74);

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'תעודת-הצטיינות-קליןפסח.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
