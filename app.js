(function () {
  "use strict";

  // Reading progress bar
  const progressBar = document.getElementById("readingProgress");
  window.addEventListener("scroll", () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? Math.min(100, Math.max(0, (window.scrollY / docH) * 100)) : 0;
    progressBar.style.width = pct + "%";
  });

  // --------------------------------------------------------------------------
  // PART 1: Online/Offline System Pipeline (with Google Firebase note)
  // --------------------------------------------------------------------------
  const PIPE_STEPS = [
    {
      online: "<strong>1. โดรนและรีโมต:</strong> ส่งภาพกล้องสด (FPV) ลงมือถือ พร้อมค่า GPS, ความสูงจากบารอมิเตอร์, มุมก้มกล้อง และทิศเข็มทิศเข้ามาตลอดเวลา",
      offline: "<strong>1. โดรนและรีโมต (ตอนไม่มีเน็ต):</strong> ยังเชื่อมต่อกับรีโมตและมือถือผ่านสัญญาณวิทยุของโดรนตามปกติ ไม่ต้องพึ่งอินเทอร์เน็ต"
    },
    {
      online: "<strong>2. แอปฝั่งนักบิน:</strong> เป็นตัวคำนวณทั้งหมดบนมือถือ ทั้งดึงความสูงภูเขา 200 จุดมาหาพิกัด 3 มิติ คำนวณค่าปรับการยิง ซ้าย/ขวา เพิ่ม/ลด และเก็บประวัติภารกิจไว้ในเครื่อง",
      offline: "<strong>2. แอปฝั่งนักบิน (ตอนไม่มีเน็ต):</strong> ยังบินโดรน จับพิกัด (ระบบจะสลับเป็นแบบประมาณพื้นราบและขึ้นป้ายบอกชัดเจน) คำนวณปรับการยิง และบันทึกประวัติลงเครื่องได้ครบเหมือนเดิม"
    },
    {
      online: "<strong>3. ระบบฝากข้อมูลกลาง (ใช้ Firebase ของ Google):</strong> ทำหน้าที่เป็นจุดฝากข้อมูลกลางแบบเรียลไทม์ จองนามเรียกขานกันชื่อซ้ำ และอัปเดตตำแหน่งโดรนกับเป้าหมายล่าสุดขึ้นส่วนกลาง (ส่งเฉพาะตัวเลขพิกัดและสถานะ ไม่ได้ส่งภาพวิดีโอ จึงกินเน็ตน้อยมาก)",
      offline: "<strong>3. ระบบฝากข้อมูลกลาง (Firebase ของ Google — พักรอสัญญาณ):</strong> แอปจะจำไว้ว่ายังไม่ได้จองชื่อ เมื่อมือถือจับเน็ตได้เมื่อไรจะเชื่อมต่อ Firebase เพื่อจองชื่อและซิงก์ให้เอง ถ้าชื่อซ้ำกับเครื่องอื่นจะเด้งแจ้งให้เปลี่ยนชื่อทันที"
    },
    {
      online: "<strong>4. หน้าจอ ผบช.:</strong> เข้าระบบด้วยรหัสผ่าน ดึงข้อมูลจาก Firebase มาแสดงโดรนทุกลำทั้ง V4 และ V5 บนแผนที่เดียวกัน พร้อมแบตเตอรี่ ดาวเทียม หมุดเป้าหมาย และเครื่องมือวัดระยะ",
      offline: "<strong>4. หน้าจอ ผบช. (ตอนนักบินไม่มีเน็ต):</strong> จะยังไม่เห็นตำแหน่งใหม่ของลำที่ออฟไลน์ จนกว่าเครื่องนักบินจะกลับมามีอินเทอร์เน็ตและส่งข้อมูลขึ้น Firebase สำเร็จ"
    }
  ];

  let sysOnline = true;
  let activePipeStep = 0;
  const pipeNodes = document.querySelectorAll("#sysPipeline .pipe-node");
  const pipeDesc = document.getElementById("pipeDesc");
  const btnSysOnline = document.getElementById("btnSysOnline");
  const btnSysOffline = document.getElementById("btnSysOffline");

  function renderPipeline() {
    btnSysOnline.classList.toggle("active", sysOnline);
    btnSysOffline.classList.toggle("offline-active", !sysOnline);
    document.getElementById("nodeCloud").classList.toggle("paused", !sysOnline);
    document.getElementById("nodeCmd").classList.toggle("paused", !sysOnline);
    document.getElementById("arrow23").className = "pipe-arrow " + (sysOnline ? "flowing" : "stopped");
    document.getElementById("arrow34").className = "pipe-arrow " + (sysOnline ? "flowing" : "stopped");
    document.getElementById("cloudSub").textContent = sysOnline ? "Firebase ของ Google" : "รอสัญญาณเน็ต";
    pipeNodes.forEach((n, i) => n.classList.toggle("active", i === activePipeStep));
    pipeDesc.innerHTML = sysOnline ? PIPE_STEPS[activePipeStep].online : PIPE_STEPS[activePipeStep].offline;
  }

  btnSysOnline.addEventListener("click", () => { sysOnline = true; renderPipeline(); });
  btnSysOffline.addEventListener("click", () => { sysOnline = false; renderPipeline(); });
  pipeNodes.forEach((n) => n.addEventListener("click", () => { activePipeStep = Number(n.dataset.step); renderPipeline(); }));
  renderPipeline();

  // Helper: Draw mini drone with spinning rotors
  function drawDrone(ctx, x, y, phase) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-30, -4);
    ctx.lineTo(30, -4);
    ctx.stroke();

    const rLen = 11 + Math.sin(phase * 10) * 4;
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30 - rLen, -10);
    ctx.lineTo(-30 + rLen, -10);
    ctx.moveTo(30 - rLen, -10);
    ctx.lineTo(30 + rLen, -10);
    ctx.stroke();

    ctx.fillStyle = "#475569";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-16, -9, 32, 13, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(0, 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(2, 7, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // PART 2: Flat Terrain Simulator
  // --------------------------------------------------------------------------
  const flatCanvas = document.getElementById("flatCanvas");
  const flatCtx = flatCanvas.getContext("2d");
  const flatAltInput = document.getElementById("flatAlt");
  const flatPitchInput = document.getElementById("flatPitch");
  let animTime = 0;

  function updateFlatReadouts() {
    const H = Number(flatAltInput.value);
    const pitch = Number(flatPitchInput.value);
    const rad = (pitch * Math.PI) / 180;
    const dist = H / Math.tan(rad);
    const slant = H / Math.sin(rad);
    const distMinus1 = H / Math.tan((Math.max(1, pitch - 1) * Math.PI) / 180);
    const err1Deg = Math.abs(distMinus1 - dist);

    document.getElementById("flatAltVal").textContent = `${H} ม.`;
    document.getElementById("flatPitchVal").textContent = `-${pitch}°`;
    document.getElementById("flatDistOut").textContent = `${dist.toFixed(1)} ม.`;
    document.getElementById("flatSlantOut").textContent = `${slant.toFixed(1)} ม.`;

    const warnBox = document.getElementById("flatWarnBox");
    const sensText = document.getElementById("flatSensText");
    if (pitch < 15) {
      warnBox.classList.add("warn");
      sensText.innerHTML = `<strong>มุมก้มตื้นเกินไป:</strong> แค่มุมกล้องเพี้ยนไป 1° ระยะทางราบจะคลาดเคลื่อนถึง <strong>${err1Deg.toFixed(1)} เมตร</strong> หน้างานควรบินเข้าใกล้หรือเพิ่มความสูงเพื่อให้ก้มกล้องได้มากขึ้น`;
    } else {
      warnBox.classList.remove("warn");
      sensText.innerHTML = `<strong>มุมก้มใช้งานได้ดี:</strong> ถ้ามุมกล้องเพี้ยน 1° ระยะจะเปลี่ยนประมาณ <strong>${err1Deg.toFixed(1)} เมตร</strong>`;
    }
  }

  function drawFlatSim() {
    const ctx = flatCtx;
    const W = flatCanvas.width;
    const Hc = flatCanvas.height;
    const alt = Number(flatAltInput.value);
    const pitch = Number(flatPitchInput.value);
    const rad = (pitch * Math.PI) / 180;
    const dist = alt / Math.tan(rad);

    ctx.clearRect(0, 0, W, Hc);

    const sky = ctx.createLinearGradient(0, 0, 0, Hc - 86);
    sky.addColorStop(0, "#f0f9ff");
    sky.addColorStop(1, "#ffffff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, Hc - 86);

    const groundY = Hc - 86;
    ctx.fillStyle = "#dcfce7";
    ctx.fillRect(0, groundY, W, 86);
    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    const droneX = 128;
    const maxDrawH = 295;
    const maxDrawW = W - 210;
    const scaleH = Math.min(maxDrawH / Math.max(alt, 60), 2.2);
    const droneY = groundY - Math.max(58, alt * scaleH);
    const visualH = groundY - droneY;
    const rawVisualD = visualH / Math.tan(rad);
    const visualD = Math.min(maxDrawW, rawVisualD);
    const targetX = droneX + visualD;
    const clipped = rawVisualD > maxDrawW;

    ctx.fillStyle = "rgba(37, 99, 235, 0.10)";
    ctx.beginPath();
    ctx.moveTo(droneX, droneY);
    ctx.lineTo(droneX, groundY);
    ctx.lineTo(targetX, groundY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(droneX, droneY + 12);
    ctx.lineTo(droneX, groundY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeRect(droneX, groundY - 18, 18, 18);

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(droneX, droneY + 7);
    ctx.lineTo(Math.min(W - 40, droneX + 190), droneY + 7);
    ctx.stroke();
    ctx.setLineDash([]);

    const actualAngle = Math.atan2(groundY - (droneY + 7), targetX - droneX);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(droneX, droneY + 7, 60, 0, actualAngle);
    ctx.stroke();

    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(droneX, droneY + 7);
    ctx.lineTo(targetX, groundY);
    ctx.stroke();

    const pulseT = (animTime * 0.45) % 1;
    const px = droneX + (targetX - droneX) * pulseT;
    const py = droneY + 7 + (groundY - (droneY + 7)) * pulseT;
    ctx.fillStyle = "#fef08a";
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(targetX, groundY, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    drawDrone(ctx, droneX, droneY, animTime);

    // Larger mobile-readable canvas labels
    ctx.font = "700 22px Sarabun, sans-serif";
    ctx.fillStyle = "#1e3a8a";
    ctx.textAlign = "right";
    ctx.fillText(`สูง ${alt} ม.`, droneX - 16, (droneY + groundY) / 2 + 8);

    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "left";
    ctx.fillText(`มุมก้ม -${pitch}°`, droneX + 70, droneY + 30);

    ctx.fillStyle = "#14532d";
    ctx.textAlign = "center";
    ctx.fillText(
      `ระยะทางราบ = ${dist.toFixed(1)} ม.${clipped ? " (ไกลล้นภาพ)" : ""}`,
      (droneX + targetX) / 2,
      groundY + 38
    );

    ctx.fillStyle = "#991b1b";
    ctx.fillText("เป้าหมาย", targetX, groundY - 18);
  }

  flatAltInput.addEventListener("input", updateFlatReadouts);
  flatPitchInput.addEventListener("input", updateFlatReadouts);
  document.querySelectorAll("[data-flat-pitch]").forEach((btn) => {
    btn.addEventListener("click", () => {
      flatPitchInput.value = btn.dataset.flatPitch;
      updateFlatReadouts();
    });
  });
  updateFlatReadouts();

  // --------------------------------------------------------------------------
  // PART 3: 3D Ray Marching Simulator
  // --------------------------------------------------------------------------
  const rmCanvas = document.getElementById("rmCanvas");
  const rmCtx = rmCanvas.getContext("2d");
  const rmAltInput = document.getElementById("rmAlt");
  const rmPitchInput = document.getElementById("rmPitch");
  const rmStepSizeInput = document.getElementById("rmStepSize");
  const chkTriangles = document.getElementById("chkTriangles");
  const chkFlatCompare = document.getElementById("chkFlatCompare");

  let rmTerrainType = "hill";
  let rmCurrentStep = 0;
  let rmPlaying = false;
  let rmLastTick = 0;
  let rmResult = null;

  function getTerrainElev(d, type) {
    if (type === "hill") {
      return 200 - 12 * Math.sin(d / 75) + 0.00072 * d * d + 0.14 * d;
    } else if (type === "valley") {
      return 250 - 95 * (1 - Math.exp(-Math.pow((d - 20) / 170, 2))) - 0.05 * d;
    } else {
      const ridge1 = 68 * Math.exp(-Math.pow((d - 185) / 55, 2));
      const ridge2 = 135 * Math.exp(-Math.pow((d - 440) / 110, 2));
      return 190 + ridge1 + ridge2;
    }
  }

  function computeRayMarch() {
    const relAlt = Number(rmAltInput.value);
    const pitch = Number(rmPitchInput.value);
    const stepM = Number(rmStepSizeInput.value);
    const rad = (pitch * Math.PI) / 180;
    const tanP = Math.tan(rad);

    const groundUnderDrone = getTerrainElev(0, rmTerrainType);
    const droneMSL = groundUnderDrone + relAlt;
    const maxDist = 560;
    const totalSteps = Math.floor(maxDist / stepM);

    const steps = [];
    let hitIndex = -1;
    for (let i = 0; i <= totalSteps; i++) {
      const d = i * stepM;
      const rayAlt = droneMSL - d * tanP;
      const terrAlt = getTerrainElev(d, rmTerrainType);
      const gap = rayAlt - terrAlt;
      steps.push({ i, d, rayAlt, terrAlt, gap });
      if (hitIndex === -1 && gap <= 0) hitIndex = i;
    }

    let exactDist = null;
    let exactElev = null;
    let interpRatio = null;
    if (hitIndex > 0) {
      const prev = steps[hitIndex - 1];
      const curr = steps[hitIndex];
      interpRatio = prev.gap / (prev.gap - curr.gap);
      exactDist = prev.d + interpRatio * (curr.d - prev.d);
      exactElev = prev.terrAlt + interpRatio * (curr.terrAlt - prev.terrAlt);
    } else if (hitIndex === 0) {
      exactDist = 0;
      exactElev = groundUnderDrone;
      interpRatio = 0;
    }

    const flatDist = relAlt / tanP;
    rmResult = {
      relAlt, pitch, stepM, tanP, groundUnderDrone, droneMSL,
      maxDist, totalSteps, steps, hitIndex, exactDist, exactElev, interpRatio, flatDist
    };

    if (rmCurrentStep > (hitIndex >= 0 ? hitIndex : totalSteps)) {
      rmCurrentStep = hitIndex >= 0 ? hitIndex : totalSteps;
    }
    updateRmUI();
  }

  function updateRmUI() {
    document.getElementById("rmAltVal").textContent = `${rmResult.relAlt} ม.`;
    document.getElementById("rmPitchVal").textContent = `-${rmResult.pitch}°`;
    document.getElementById("rmStepSizeVal").textContent = `${rmResult.stepM} ม./ก้าว`;

    const s = rmResult.steps[Math.min(rmCurrentStep, rmResult.steps.length - 1)];
    const isHitNow = rmResult.hitIndex >= 0 && rmCurrentStep >= rmResult.hitIndex;
    const reachedEndNoHit = rmResult.hitIndex < 0 && rmCurrentStep >= rmResult.totalSteps;

    document.getElementById("rmStepLabel").textContent = `ก้าวที่ ${s.i} (เดินตรงมา ${s.d} ม.)`;
    document.getElementById("rmRayMsl").textContent = `${s.rayAlt.toFixed(1)} ม.`;
    document.getElementById("rmGroundMsl").textContent = `${s.terrAlt.toFixed(1)} ม.`;
    document.getElementById("rmGap").textContent =
      s.gap > 0 ? `+${s.gap.toFixed(1)} ม. (ยังลอยเหนือดิน)` : `${s.gap.toFixed(1)} ม. (จมใต้ดินแล้ว)`;

    const badge = document.getElementById("rmStatusBadge");
    badge.className = "tele-badge";
    if (isHitNow) {
      badge.classList.add("hit");
      badge.textContent = "ชนภูเขาแล้ว หยุด";
    } else if (reachedEndNoHit) {
      badge.classList.add("miss");
      badge.textContent = "ไม่ชน ใช้พื้นราบ";
    } else if (rmCurrentStep === 0) {
      badge.textContent = "จุดเริ่มใต้โดรน";
    } else {
      badge.textContent = "ยังลอย เดินต่อ";
    }

    const interpEl = document.getElementById("rmInterpText");
    if (isHitNow && rmResult.hitIndex > 0) {
      const prev = rmResult.steps[rmResult.hitIndex - 1];
      const curr = rmResult.steps[rmResult.hitIndex];
      const errDiff = Math.abs(rmResult.flatDist - rmResult.exactDist);
      const errType = rmResult.flatDist > rmResult.exactDist ? "เลยเป้าไปไกลเกินจริง" : "สั้นกว่าเป้าหมายจริง";
      interpEl.innerHTML =
        `• ก้าวที่ ${prev.i} (${prev.d} ม.): ลอยเหนือดิน <strong>+${prev.gap.toFixed(1)} ม.</strong><br/>` +
        `• ก้าวที่ ${curr.i} (${curr.d} ม.): จมใต้ดิน <strong>${curr.gap.toFixed(1)} ม.</strong><br/>` +
        `• แบ่งสัดส่วนช่วงนี้: ${prev.gap.toFixed(1)} ÷ (${prev.gap.toFixed(1)} + ${Math.abs(curr.gap).toFixed(1)}) = <strong>${(rmResult.interpRatio * 100).toFixed(0)}%</strong><br/>` +
        `<strong>ระยะชนจริง = ${rmResult.exactDist.toFixed(1)} ม.</strong> (พื้นตรงเป้าสูง ${rmResult.exactElev.toFixed(1)} ม. เหนือน้ำทะเล)<br/>` +
        `เทียบกับสูตรพื้นราบ (${rmResult.flatDist.toFixed(1)} ม.): <strong>ต่างกัน ${errDiff.toFixed(1)} ม. (${errType})</strong>`;
    } else if (reachedEndNoHit) {
      interpEl.innerHTML =
        `เดินครบทุกก้าวแล้วแต่ลำแสงยังไม่ตัดพื้น (พื้นลาดลงเร็วกว่ามุมก้มกล้อง) โปรแกรมจึงสลับกลับไปใช้สูตรพื้นราบ = <strong>${rmResult.flatDist.toFixed(1)} ม.</strong> แทน`;
    } else {
      interpEl.innerHTML =
        `ตอนนี้เช็กอยู่ที่ <strong>ก้าวที่ ${s.i}</strong> (ระยะราบ ${s.d} ม.) ลำแสงยังสูงกว่าพื้นดินอีก <strong>${s.gap.toFixed(1)} ม.</strong> กดปุ่ม “เล่นเดินทีละก้าว” หรือ “เดินทีละ 1 ก้าว” เพื่อดูต่อครับ`;
    }
  }

  function drawRayMarchSim() {
    const ctx = rmCtx;
    const W = rmCanvas.width;
    const Hc = rmCanvas.height;
    ctx.clearRect(0, 0, W, Hc);

    const padL = 78;
    const padR = 34;
    const padT = 44;
    const padB = 56;
    const maxD = rmResult.maxDist;
    const minElev = 110;
    const maxElev = Math.max(460, rmResult.droneMSL + 40);

    const toX = (d) => padL + (d / maxD) * (W - padL - padR);
    const toY = (e) => (Hc - padB) - ((e - minElev) / (maxElev - minElev)) * (Hc - padT - padB);

    const sky = ctx.createLinearGradient(0, 0, 0, Hc);
    sky.addColorStop(0, "#f8fbff");
    sky.addColorStop(1, "#ffffff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, Hc);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.font = "600 15px Sarabun, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "right";
    for (let e = 150; e <= maxElev; e += 50) {
      const y = toY(e);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.fillText(`${e} ม.`, padL - 8, y + 5);
    }

    ctx.textAlign = "center";
    for (let d = 0; d <= maxD; d += 100) {
      ctx.fillText(`${d} ม.`, toX(d), Hc - 20);
    }

    const droneX = toX(0);
    const droneY = toY(rmResult.droneMSL);

    if (chkTriangles.checked && rmCurrentStep > 0) {
      const maxIdx = Math.min(rmCurrentStep, rmResult.steps.length - 1);
      for (let i = maxIdx; i >= 1; i--) {
        const s = rmResult.steps[i];
        const sx = toX(s.d);
        const sy = toY(s.rayAlt);
        const isHitStep = rmResult.hitIndex === i;
        ctx.fillStyle = isHitStep
          ? "rgba(220, 38, 38, 0.14)"
          : i % 2 === 0
            ? "rgba(37, 99, 235, 0.08)"
            : "rgba(16, 185, 129, 0.08)";
        ctx.beginPath();
        ctx.moveTo(droneX, droneY);
        ctx.lineTo(sx, droneY);
        ctx.lineTo(sx, sy);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isHitStep ? "rgba(220,38,38,0.5)" : "rgba(51,65,85,0.22)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sx, droneY);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(droneX, droneY);
      ctx.lineTo(toX(rmResult.steps[maxIdx].d), droneY);
      ctx.stroke();
    }

    const terrGrad = ctx.createLinearGradient(0, toY(340), 0, Hc - padB);
    terrGrad.addColorStop(0, "rgba(134, 239, 172, 0.75)");
    terrGrad.addColorStop(1, "rgba(220, 252, 231, 0.35)");
    ctx.fillStyle = terrGrad;
    ctx.beginPath();
    ctx.moveTo(toX(0), Hc - padB);
    for (let d = 0; d <= maxD; d += 4) {
      ctx.lineTo(toX(d), toY(getTerrainElev(d, rmTerrainType)));
    }
    ctx.lineTo(toX(maxD), Hc - padB);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#15803d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let d = 0; d <= maxD; d += 4) {
      const x = toX(d);
      const y = toY(getTerrainElev(d, rmTerrainType));
      if (d === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (chkFlatCompare.checked) {
      const flatY = toY(rmResult.groundUnderDrone);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(toX(0), flatY);
      ctx.lineTo(W - padR, flatY);
      ctx.stroke();

      if (rmResult.flatDist <= maxD) {
        const fx = toX(rmResult.flatDist);
        ctx.strokeStyle = "#ea580c";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(droneX, droneY);
        ctx.lineTo(fx, flatY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = "#ea580c";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fx - 8, flatY - 8);
        ctx.lineTo(fx + 8, flatY + 8);
        ctx.moveTo(fx + 8, flatY - 8);
        ctx.lineTo(fx - 8, flatY + 8);
        ctx.stroke();

        ctx.font = "700 17px Sarabun, sans-serif";
        ctx.fillStyle = "#c2410c";
        ctx.textAlign = "center";
        ctx.fillText(`สูตรพื้นราบ (${rmResult.flatDist.toFixed(0)} ม.)`, fx, flatY + 24);
      } else {
        ctx.setLineDash([]);
      }
    }

    const curStepObj = rmResult.steps[Math.min(rmCurrentStep, rmResult.steps.length - 1)];
    const curX = toX(curStepObj.d);
    const curRayY = toY(curStepObj.rayAlt);
    const curTerrY = toY(curStepObj.terrAlt);

    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(droneX, droneY);
    ctx.lineTo(curX, curRayY);
    ctx.stroke();

    for (let i = 0; i <= rmCurrentStep && i < rmResult.steps.length; i++) {
      const s = rmResult.steps[i];
      ctx.fillStyle = s.gap <= 0 ? "#dc2626" : "#2563eb";
      ctx.beginPath();
      ctx.arc(toX(s.d), toY(s.terrAlt), i === rmCurrentStep ? 6.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const isHitNow = rmResult.hitIndex >= 0 && rmCurrentStep >= rmResult.hitIndex;
    ctx.strokeStyle = isHitNow ? "#dc2626" : "#2563eb";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(curX, curRayY);
    ctx.lineTo(curX, curTerrY);
    ctx.stroke();

    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(curX, curRayY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "700 18px Sarabun, sans-serif";
    const tagText = isHitNow
      ? `ก้าวที่ ${curStepObj.i}: จมดิน ${curStepObj.gap.toFixed(1)} ม. หยุด`
      : `ก้าวที่ ${curStepObj.i}: ลอย +${curStepObj.gap.toFixed(1)} ม. เดินต่อ`;
    const tagW = ctx.measureText(tagText).width + 22;
    const tagX = Math.min(W - padR - tagW - 4, Math.max(padL + 4, curX - tagW / 2));
    const tagY = Math.max(10, Math.min(curRayY, curTerrY) - 46);
    ctx.fillStyle = isHitNow ? "#fef2f2" : "#eff6ff";
    ctx.strokeStyle = isHitNow ? "#dc2626" : "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagW, 34, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isHitNow ? "#b91c1c" : "#1d4ed8";
    ctx.textAlign = "left";
    ctx.fillText(tagText, tagX + 11, tagY + 24);

    if (isHitNow && rmResult.exactDist !== null) {
      const hx = toX(rmResult.exactDist);
      const hy = toY(rmResult.exactElev);
      const glow = ctx.createRadialGradient(hx, hy, 2, hx, hy, 24);
      glow.addColorStop(0, "rgba(250, 204, 21, 0.95)");
      glow.addColorStop(1, "rgba(250, 204, 21, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(hx, hy, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#facc15";
      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx, hy, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.font = "700 18px Sarabun, sans-serif";
      ctx.fillStyle = "#854d0e";
      ctx.textAlign = "center";
      ctx.fillText(`จุดชนจริง ${rmResult.exactDist.toFixed(1)} ม.`, hx, hy - 18);
    }

    drawDrone(ctx, droneX, droneY - 6, animTime);
  }

  document.querySelectorAll("#terrainPicks .chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#terrainPicks .chip").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      rmTerrainType = btn.dataset.terrain;
      rmPlaying = false;
      rmCurrentStep = 0;
      computeRayMarch();
    });
  });

  [rmAltInput, rmPitchInput, rmStepSizeInput].forEach((inp) => {
    inp.addEventListener("input", () => {
      rmPlaying = false;
      computeRayMarch();
    });
  });

  document.getElementById("btnRmPlay").addEventListener("click", () => {
    const endStep = rmResult.hitIndex >= 0 ? rmResult.hitIndex : rmResult.totalSteps;
    if (rmCurrentStep >= endStep) rmCurrentStep = 0;
    rmPlaying = true;
    rmLastTick = performance.now();
  });

  document.getElementById("btnRmStep").addEventListener("click", () => {
    rmPlaying = false;
    const endStep = rmResult.hitIndex >= 0 ? rmResult.hitIndex : rmResult.totalSteps;
    if (rmCurrentStep < endStep) {
      rmCurrentStep++;
      updateRmUI();
    }
  });

  document.getElementById("btnRmInstant").addEventListener("click", () => {
    rmPlaying = false;
    rmCurrentStep = rmResult.hitIndex >= 0 ? rmResult.hitIndex : rmResult.totalSteps;
    updateRmUI();
  });

  document.getElementById("btnRmReset").addEventListener("click", () => {
    rmPlaying = false;
    rmCurrentStep = 0;
    updateRmUI();
  });

  computeRayMarch();

  // --------------------------------------------------------------------------
  // PART 4: OT Line Top-Down Map (Touch & Mouse Draggable)
  // --------------------------------------------------------------------------
  const otCanvas = document.getElementById("otCanvas");
  const otCtx = otCanvas.getContext("2d");

  const OT_SCALE = 4.0;
  const O_PT = { x: 160, y: 425 };
  const T_DIST_M = 2000;
  const T_AZ_DEG = 56.25;
  const T_AZ_RAD = (T_AZ_DEG * Math.PI) / 180;
  const T_PT = {
    x: O_PT.x + (T_DIST_M / OT_SCALE) * Math.sin(T_AZ_RAD),
    y: O_PT.y - (T_DIST_M / OT_SCALE) * Math.cos(T_AZ_RAD)
  };

  let R_PT = {
    x: O_PT.x + (1900 / OT_SCALE) * Math.sin((54 * Math.PI) / 180),
    y: O_PT.y - (1900 / OT_SCALE) * Math.cos((54 * Math.PI) / 180)
  };
  let isDraggingR = false;

  function computeOtAdjustment() {
    const dxR = (R_PT.x - O_PT.x) * OT_SCALE;
    const dyR = (O_PT.y - R_PT.y) * OT_SCALE;
    const rDist = Math.hypot(dxR, dyR);
    let rAzRad = Math.atan2(dxR, dyR);
    if (rAzRad < 0) rAzRad += 2 * Math.PI;

    let diff = rAzRad - T_AZ_RAD;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff <= -Math.PI) diff += 2 * Math.PI;

    const lrMeters = -rDist * Math.sin(diff);
    const fbMeters = T_DIST_M - rDist * Math.cos(diff);

    const lrDir = lrMeters >= 0 ? "ขวา" : "ซ้าย";
    const fbDir = fbMeters >= 0 ? "เพิ่ม" : "ลด";
    const rMils = Math.round(((rAzRad * 180) / Math.PI / 360) * 6400);
    const tMils = Math.round((T_AZ_DEG / 360) * 6400);

    const projDistPx = (rDist * Math.cos(diff)) / OT_SCALE;
    const P_PT = {
      x: O_PT.x + projDistPx * Math.sin(T_AZ_RAD),
      y: O_PT.y - projDistPx * Math.cos(T_AZ_RAD)
    };

    document.getElementById("otTargetDist").textContent = `${T_DIST_M.toLocaleString()} ม.`;
    document.getElementById("otTargetMils").textContent = `${tMils.toLocaleString()} มิล`;
    document.getElementById("otRoundDist").textContent = `${Math.round(rDist).toLocaleString()} ม.`;
    document.getElementById("otRoundMils").textContent = `${rMils.toLocaleString()} มิล`;

    const cmdText = `${lrDir} ${Math.round(Math.abs(lrMeters))} ม. · ${fbDir} ${Math.round(Math.abs(fbMeters))} ม.`;
    document.getElementById("otCommandText").textContent = cmdText;

    const diffDeg = (diff * 180) / Math.PI;
    document.getElementById("otFormulaLive").innerHTML =
      `<strong>วิธีคิดจากจุดตกที่คุณวางไว้:</strong><br/>` +
      `• มุมต่าง = ${((rAzRad * 180) / Math.PI).toFixed(1)}° − ${T_AZ_DEG.toFixed(1)}° = <strong>${diffDeg.toFixed(1)}°</strong><br/>` +
      `• ซ้าย/ขวา = −${Math.round(rDist)} × sin(${diffDeg.toFixed(1)}°) = <strong>${lrDir} ${Math.round(Math.abs(lrMeters))} ม.</strong><br/>` +
      `• เพิ่ม/ลด = ${T_DIST_M} − (${Math.round(rDist)} × cos(${diffDeg.toFixed(1)}°)) = <strong>${fbDir} ${Math.round(Math.abs(fbMeters))} ม.</strong>`;

    return { P_PT, lrDir, fbDir, lrAbs: Math.round(Math.abs(lrMeters)), fbAbs: Math.round(Math.abs(fbMeters)) };
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, width) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 6) return;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const head = Math.min(15, len * 0.35);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(ang) * head * 0.6, y2 - Math.sin(ang) * head * 0.6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();
  }

  function drawOtSim() {
    const ctx = otCtx;
    const W = otCanvas.width;
    const Hc = otCanvas.height;
    const calc = computeOtAdjustment();

    ctx.clearRect(0, 0, W, Hc);

    ctx.fillStyle = "#fbfdff";
    ctx.fillRect(0, 0, W, Hc);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Hc); ctx.stroke();
    }
    for (let y = 0; y < Hc; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    drawArrow(ctx, 56, 98, 56, 36, "#0f172a", 4.5);
    ctx.font = "700 19px Sarabun, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.fillText("เหนือ", 56, 24);
    ctx.font = "600 16px Sarabun, sans-serif";
    ctx.fillStyle = "#475569";
    ctx.fillText("(0 มิล)", 56, 120);

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(O_PT.x, O_PT.y);
    ctx.lineTo(O_PT.x, 45);
    ctx.stroke();

    ctx.strokeStyle = "rgba(30, 58, 138, 0.2)";
    ctx.beginPath();
    ctx.moveTo(O_PT.x, O_PT.y);
    ctx.lineTo(O_PT.x + 800 * Math.sin(T_AZ_RAD), O_PT.y - 800 * Math.cos(T_AZ_RAD));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(O_PT.x, O_PT.y);
    ctx.lineTo(T_PT.x, T_PT.y);
    ctx.stroke();

    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(O_PT.x, O_PT.y);
    ctx.lineTo(R_PT.x, R_PT.y);
    ctx.stroke();
    ctx.setLineDash([]);

    drawArrow(ctx, R_PT.x, R_PT.y, calc.P_PT.x, calc.P_PT.y, "#15803d", 5.5);
    drawArrow(ctx, calc.P_PT.x, calc.P_PT.y, T_PT.x, T_PT.y, "#0f766e", 5.5);

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(calc.P_PT.x, calc.P_PT.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2563eb";
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(O_PT.x, O_PT.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 18px Sarabun, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ตฝ.", O_PT.x, O_PT.y + 6);
    ctx.fillStyle = "#1e3a8a";
    ctx.fillText("จุดตรวจการณ์ (ตฝ.)", O_PT.x, O_PT.y + 44);

    ctx.fillStyle = "#fee2e2";
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(T_PT.x, T_PT.y, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(T_PT.x - 24, T_PT.y); ctx.lineTo(T_PT.x + 24, T_PT.y);
    ctx.moveTo(T_PT.x, T_PT.y - 24); ctx.lineTo(T_PT.x, T_PT.y + 24);
    ctx.stroke();
    ctx.fillStyle = "#991b1b";
    ctx.font = "800 20px Sarabun, sans-serif";
    ctx.fillText("เป้าหมาย", T_PT.x + 54, T_PT.y - 12);

    const haloR = 24 + Math.sin(animTime * 4) * 3;
    ctx.fillStyle = "rgba(251, 146, 60, 0.28)";
    ctx.beginPath();
    ctx.arc(R_PT.x, R_PT.y, haloR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fb923c";
    ctx.strokeStyle = "#c2410c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(R_PT.x, R_PT.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#9a3412";
    ctx.font = "800 18px Sarabun, sans-serif";
    ctx.fillText("จุดตกกระสุน (แตะลากได้)", R_PT.x, R_PT.y - 26);

    ctx.font = "700 18px Sarabun, sans-serif";
    if (calc.lrAbs > 5) {
      ctx.fillStyle = "#15803d";
      ctx.fillText(`${calc.lrDir} ${calc.lrAbs} ม.`, (R_PT.x + calc.P_PT.x) / 2, (R_PT.y + calc.P_PT.y) / 2 - 12);
    }
    if (calc.fbAbs > 5) {
      ctx.fillStyle = "#0f766e";
      ctx.fillText(`${calc.fbDir} ${calc.fbAbs} ม.`, (calc.P_PT.x + T_PT.x) / 2 + 12, (calc.P_PT.y + T_PT.y) / 2 + 26);
    }
  }

  function getCanvasPos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function startDrag(e) {
    const pos = getCanvasPos(otCanvas, e);
    R_PT.x = Math.max(40, Math.min(otCanvas.width - 40, pos.x));
    R_PT.y = Math.max(40, Math.min(otCanvas.height - 40, pos.y));
    isDraggingR = true;
    e.preventDefault();
  }
  function moveDrag(e) {
    if (!isDraggingR) return;
    const pos = getCanvasPos(otCanvas, e);
    R_PT.x = Math.max(40, Math.min(otCanvas.width - 40, pos.x));
    R_PT.y = Math.max(40, Math.min(otCanvas.height - 40, pos.y));
    e.preventDefault();
  }
  function endDrag() { isDraggingR = false; }

  otCanvas.addEventListener("mousedown", startDrag);
  window.addEventListener("mousemove", moveDrag);
  window.addEventListener("mouseup", endDrag);
  otCanvas.addEventListener("touchstart", startDrag, { passive: false });
  window.addEventListener("touchmove", moveDrag, { passive: false });
  window.addEventListener("touchend", endDrag);

  document.getElementById("btnRandomShot").addEventListener("click", () => {
    const randAngle = ((40 + Math.random() * 34) * Math.PI) / 180;
    const randDist = 1350 + Math.random() * 1150;
    R_PT.x = Math.max(60, Math.min(otCanvas.width - 60, O_PT.x + (randDist / OT_SCALE) * Math.sin(randAngle)));
    R_PT.y = Math.max(50, Math.min(otCanvas.height - 50, O_PT.y - (randDist / OT_SCALE) * Math.cos(randAngle)));
  });

  document.getElementById("btnResetShot").addEventListener("click", () => {
    R_PT.x = O_PT.x + (1900 / OT_SCALE) * Math.sin((54 * Math.PI) / 180);
    R_PT.y = O_PT.y - (1900 / OT_SCALE) * Math.cos((54 * Math.PI) / 180);
  });

  // Main animation loop
  function tick(now) {
    animTime = now / 1000;
    if (rmPlaying && now - rmLastTick >= 340) {
      rmLastTick = now;
      const endStep = rmResult.hitIndex >= 0 ? rmResult.hitIndex : rmResult.totalSteps;
      if (rmCurrentStep < endStep) {
        rmCurrentStep++;
        updateRmUI();
      } else {
        rmPlaying = false;
      }
    }
    drawFlatSim();
    drawRayMarchSim();
    drawOtSim();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
