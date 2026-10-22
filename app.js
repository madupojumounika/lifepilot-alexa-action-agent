(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("goal-form"), goalInput = $("goal-input"), planBtn = $("plan-btn");
  let currentPlan = null, currentTasks = [], busy = false, toastTimer, currentUser = null, authMode = "login";
  let agentRoadmap = null, agentCompletedDays = [];
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const dateFromISO = (value) => { const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(Number(m[1]), Number(m[2])-1, Number(m[3])) : null; };
  const formatDate = (date, options={weekday:"short", month:"short", day:"numeric"}) => new Intl.DateTimeFormat(undefined, options).format(date);
  function renderWeekDates() {
    const grid = $("week-grid"); if (!grid) return;
    const today = new Date(); today.setHours(0,0,0,0);
    const dates = Array.from({length:7}, (_,i) => { const d = new Date(today); d.setDate(today.getDate()+i); return d; });
    grid.innerHTML = dates.map((d,i) => `<div class="week-day" title="${formatDate(d,{weekday:"long",year:"numeric",month:"long",day:"numeric"})}"><span>${formatDate(d,{weekday:"short"}).slice(0,1)}</span><strong>${d.getDate()}</strong><i class="day-dot ${i===0?"filled":""}"></i></div>`).join("");
    const stamp = $("week-range"); if (stamp) stamp.textContent = `${formatDate(dates[0],{month:"short",day:"numeric"})} – ${formatDate(dates[6],{month:"short",day:"numeric"})}`;
  }
  function formatTaskDate(task) {
    let start = dateFromISO(currentPlan?.start_date);
    if (!start && currentPlan?.created_at) { const created = new Date(currentPlan.created_at); if (!Number.isNaN(created.getTime())) start = new Date(created.getFullYear(),created.getMonth(),created.getDate()); }
    if (!start) start = new Date();
    start.setDate(start.getDate() + Math.max(0, Number(task.day_index || 1)-1));
    return formatDate(start);
  }
  const escapeHtml = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const showToast = (message) => { const el = $("toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3200); };
  const log = (title, detail, type="normal", stamp="JUST NOW") => {
    const row = document.createElement("div"); row.className = "activity-item";
    const marker = document.createElement("div"); marker.className = "activity-marker " + (type === "success" ? "success" : "");
    marker.textContent = type === "success" ? "✓" : "✦";
    const body = document.createElement("div");
    const strong = document.createElement("strong"); strong.textContent = title;
    const p = document.createElement("p"); p.textContent = detail;
    const small = document.createElement("small"); small.textContent = stamp;
    body.append(strong,p,small); row.append(marker,body); $("activity-list").prepend(row);
  };
  async function request(path, body) {
    const response = await fetch(path, {method: body ? "POST" : "GET", credentials: "same-origin", headers: body ? {"Content-Type":"application/json"} : {}, body: body ? JSON.stringify(body) : undefined});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }
  // Conversational interface powered by the deployed LifePilot MCP tools.
  const agentForm = $("voice-agent-form"), agentInput = $("voice-agent-input"), agentSend = $("voice-agent-send");
  const agentConversation = $("voice-conversation");
  function addAgentMessage(role, message, stamp) {
    const item = document.createElement("div"); item.className = "voice-message " + (role === "user" ? "user-message" : "assistant-message");
    const avatar = document.createElement("span"); avatar.className = "message-avatar"; avatar.textContent = role === "user" ? (currentUser?.display_name || "Y").trim().charAt(0).toUpperCase() : "L";
    const body = document.createElement("div"); const name = document.createElement("strong"); name.textContent = role === "user" ? "You" : "LifePilot";
    const paragraph = document.createElement("p"); paragraph.textContent = message; body.append(name, paragraph);
    if (stamp) { const small = document.createElement("small"); small.textContent = stamp; body.append(small); }
    item.append(avatar, body); agentConversation.append(item); agentConversation.scrollTop = agentConversation.scrollHeight; return body;
  }
  async function callMcpTool(name, args) {
    const response = await fetch("/api/mcp", {method:"POST", headers:{"Content-Type":"application/json","Accept":"application/json, text/event-stream","MCP-Protocol-Version":"2025-11-25"}, body:JSON.stringify({jsonrpc:"2.0",id:Date.now(),method:"tools/call",params:{name,arguments:args}})});
    const raw = await response.text(); let payload;
    try { payload = JSON.parse(raw); } catch (_) { const line = raw.split("\n").find(part => part.startsWith("data:")); if (line) { try { payload = JSON.parse(line.slice(5).trim()); } catch (_) {} } }
    if (!response.ok) throw new Error(payload?.error?.message || "LifePilot could not reach its planning tools. Please try again.");
    if (!payload) throw new Error("The planning service returned an unreadable response.");
    if (payload.error) throw new Error(payload.error.message || "The planning tool returned an error.");
    if (payload.result?.isError) { const text = payload.result.content?.find(part => part.type === "text")?.text; throw new Error(text || "The planning tool could not complete that request."); }
    const text = payload.result?.content?.find(part => part.type === "text")?.text; if (!text) throw new Error("The planning tool returned no result.");
    try { return JSON.parse(text); } catch (_) { return {message:text}; }
  }
  function addRoadmapCard(body, roadmap) {
    const card = document.createElement("div"); card.className = "voice-result-card";
    const head = document.createElement("div"); head.className = "voice-result-head";
    const title = document.createElement("span"); title.textContent = "YOUR 7-DAY ROADMAP"; const count = document.createElement("span"); count.textContent = (roadmap.tasks || []).length + " ACTIONS"; head.append(title,count); card.append(head);
    (roadmap.tasks || []).forEach(task => {
      const row = document.createElement("div"); row.className = "voice-result-task"; const day = document.createElement("span"); day.textContent = "D" + task.day;
      const details = document.createElement("div"); const taskTitle = document.createElement("strong"); taskTitle.textContent = task.title;
      const category = document.createElement("p"); category.textContent = task.category + " · " + task.durationMinutes + " min"; details.append(taskTitle,category);
      const date = document.createElement("small"); date.textContent = task.date || ("DAY " + task.day); row.append(day,details,date); card.append(row);
    });
    const actions = document.createElement("div"); actions.className = "voice-result-actions";
    const review = document.createElement("button"); review.type = "button"; review.textContent = "Review in my workspace ↗";
    review.addEventListener("click", () => { goalInput.value = roadmap.goal; form.requestSubmit(); $("composer-title").scrollIntoView({behavior:"smooth",block:"start"}); });
    const next = document.createElement("button"); next.type = "button"; next.className = "secondary"; next.textContent = "Recommend next step"; next.addEventListener("click", () => runAgentAction("next"));
    actions.append(review,next); card.append(actions); body.append(card);
  }
  async function runAgentAction(action, goalOverride) {
    if (agentSend.disabled) return;
    const goal = (goalOverride || agentRoadmap?.goal || goalInput.value || "").trim();
    if (action !== "roadmap" && !agentRoadmap) { addAgentMessage("assistant", "Start by telling me your goal. I will create a roadmap first, then recommend a next step or calculate progress."); return; }
    if (action === "roadmap" && goal.length < 8) { addAgentMessage("assistant", "Tell me a little more about what you want to achieve so I can prepare a useful roadmap."); return; }
    agentSend.disabled = true; const previousLabel = agentSend.innerHTML; agentSend.innerHTML = "Working… <span>◌</span>";
    try {
      if (action === "roadmap") {
        addAgentMessage("assistant", "I am mapping your goal into seven focused steps. You can review the result before adding it to your workspace.", "MCP · GENERATE GOAL ROADMAP");
        const result = await callMcpTool("generate_goal_roadmap", {goal:goal,startDate:todayISO()}); agentRoadmap = result; agentCompletedDays = [];
        const body = addAgentMessage("assistant", "Your roadmap is ready: " + (result.tasks?.length || 7) + " focused actions for “" + (result.goal || goal) + "”. Review the steps below, then choose whether to bring this goal into your workspace.", "ROADMAP READY · HUMAN REVIEW");
        addRoadmapCard(body,result); speak("Your LifePilot roadmap is ready. Review the seven steps and choose whether to bring the goal into your workspace.");
      } else if (action === "next") {
        const result = await callMcpTool("recommend_next_action", {goal:goal,completedDays:agentCompletedDays}); const next = result.nextAction;
        if (!next) { addAgentMessage("assistant", "You have marked every day complete in this conversation. Review what you learned and choose your next goal.", "MCP · NEXT ACTION"); }
        else {
          const body = addAgentMessage("assistant", "I suggest starting with Day " + next.day + ": " + next.title + ". It is part of " + next.category + " and is estimated at " + next.durationMinutes + " minutes. Current roadmap progress: " + result.progressPercent + "%.", "MCP · NEXT ACTION RECOMMENDATION");
          const actions = document.createElement("div"); actions.className = "voice-result-actions";
          const done = document.createElement("button"); done.type = "button"; done.textContent = "Count Day " + next.day + " complete in this check";
          done.addEventListener("click", async () => {
            if (!agentCompletedDays.includes(next.day)) agentCompletedDays.push(next.day);
            addAgentMessage("assistant", "Day " + next.day + " is counted as complete for this conversational progress check. Use the task controls in your workspace to persist task completion.", "LOCAL CONVERSATION STATE");
            try { const statuses = Array.from({length:7}, (_,i) => agentCompletedDays.includes(i+1) ? "done" : "pending"); const progress = await callMcpTool("calculate_plan_progress", {statuses:statuses}); addAgentMessage("assistant", "Progress check: " + progress.done + " of " + progress.total + " days complete (" + progress.completionPercent + "%)."); } catch (error) { addAgentMessage("assistant", error.message); }
          });
          const progressBtn = document.createElement("button"); progressBtn.type = "button"; progressBtn.className = "secondary"; progressBtn.textContent = "Calculate progress"; progressBtn.addEventListener("click", () => runAgentAction("progress"));
          actions.append(done,progressBtn); body.append(actions); speak("Your next step is " + next.title + ". It is estimated at " + next.durationMinutes + " minutes.");
        }
      } else if (action === "progress") {
        const statuses = Array.from({length:7}, (_,i) => agentCompletedDays.includes(i+1) ? "done" : "pending"); const result = await callMcpTool("calculate_plan_progress", {statuses:statuses});
        addAgentMessage("assistant", "Your conversational progress check is " + result.done + " of " + result.total + " days complete (" + result.completionPercent + "%). " + result.pending + " days remain pending. This check uses progress marked in this voice session; saved workspace tasks are tracked separately.", "MCP · PLAN PROGRESS");
        speak("You have completed " + result.done + " out of " + result.total + " days, which is " + result.completionPercent + " percent.");
      }
    } catch (error) { addAgentMessage("assistant", error.message || "I could not complete that request. Please try again.", "PLEASE TRY AGAIN"); }
    finally { agentSend.disabled = false; agentSend.innerHTML = previousLabel; }
  }
  if (agentForm) agentForm.addEventListener("submit", event => { event.preventDefault(); const message = agentInput.value.trim(); if (!message) return; addAgentMessage("user", message, "YOUR REQUEST"); agentInput.value = ""; runAgentAction("roadmap", message); });
  document.querySelectorAll("[data-voice-prompt]").forEach(button => button.addEventListener("click", () => { const prompt = button.dataset.voicePrompt || ""; agentInput.value = prompt; addAgentMessage("user", prompt, "QUICK PROMPT"); runAgentAction("roadmap", prompt); }));
  document.querySelectorAll("[data-voice-action]").forEach(button => button.addEventListener("click", () => { const action = button.dataset.voiceAction; addAgentMessage("user", action === "next" ? "What should I do next?" : "Show my plan progress.", "QUICK ACTION"); runAgentAction(action); }));
  const agentMic = $("voice-agent-mic");
  if (agentMic) agentMic.addEventListener("click", () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { showToast("Voice input is not supported here. Type your request or try a supported browser."); return; }
    const recognition = new Recognition(); recognition.lang = "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 1; agentMic.disabled = true; agentMic.textContent = "…";
    recognition.onresult = event => { const transcript = event.results?.[0]?.[0]?.transcript?.trim(); if (transcript) { agentInput.value = transcript; agentInput.focus(); showToast("Voice captured. Send your request when ready."); } };
    recognition.onerror = event => showToast(event.error === "not-allowed" ? "Allow microphone access to use voice input." : "I could not capture that. Please try again or type your request.");
    recognition.onend = () => { agentMic.disabled = false; agentMic.textContent = "◖"; };
    try { recognition.start(); } catch (_) { agentMic.disabled = false; agentMic.textContent = "◖"; showToast("Voice input could not start. Please try again."); }
  });
  function updateMetrics() {
    const done = currentTasks.filter(t => t.status === "done").length;
    $("metric-mission").textContent = currentPlan ? (currentPlan.goal.length > 22 ? currentPlan.goal.slice(0,22) + "…" : currentPlan.goal) : "—";
    $("metric-mission").title = currentPlan?.goal || "";
    $("metric-actions").textContent = currentTasks.length;
    $("metric-done").textContent = done;
    const pct = currentTasks.length ? Math.round(done/currentTasks.length*100) : 0;
    $("metric-percent").textContent = pct + "% complete";
    $("progress-fill").style.width = pct + "%";
    $("nav-count").textContent = currentTasks.length;
  }
  function renderTasks() {
    const list = $("task-list"), empty = $("empty-plan"), footer = $("plan-footer");
    if (!currentPlan || !currentTasks.length) { empty.hidden = false; list.hidden = true; footer.hidden = true; $("plan-status").textContent = "WAITING FOR A GOAL"; updateMetrics(); return; }
    empty.hidden = true; list.hidden = false; footer.hidden = false;
    const allApproved = currentTasks.every(t => t.status !== "pending");
    const allDone = currentTasks.every(t => t.status === "done");
    $("plan-status").textContent = allDone ? "MISSION COMPLETE" : allApproved ? "PLAN APPROVED" : "REVIEW REQUIRED";
    $("approval-copy").textContent = allApproved ? (allDone ? "All actions marked complete." : "Plan approved · mark actions done as you complete them.") : "Review your actions before approving.";
    $("approve-btn").disabled = allApproved;
    $("approve-btn").classList.toggle("approved", allApproved);
    $("approve-btn").innerHTML = allApproved ? (allDone ? "Mission complete ✓" : "Plan approved ✓") : 'Approve plan <span>✓</span>';
    list.innerHTML = currentTasks.map((t) => {
      const done = t.status === "done", approved = t.status === "approved";
      const stateClass = done ? "done" : approved ? "approved" : "";
      const icon = done ? "✓" : approved ? "✓" : "·";
      const buttonLabel = done ? "Reopen task" : approved ? "Mark done" : "Pending approval";
      return '<div class="task-row '+(done?'is-done':'')+'"><button class="task-check '+stateClass+'" data-task="'+escapeHtml(t.id)+'" data-status="'+escapeHtml(t.status)+'" aria-label="'+buttonLabel+'" title="'+buttonLabel+'">'+icon+'</button><div><div class="task-title">'+escapeHtml(t.title)+'</div><div class="task-meta">'+escapeHtml(t.category)+' · '+Number(t.duration_minutes)+' min · '+escapeHtml(formatTaskDate(t))+'</div></div><span class="day-chip">DAY '+Number(t.day_index)+'</span></div>';
    }).join("");
    list.querySelectorAll(".task-check").forEach(btn => btn.addEventListener("click", async () => {
      const status = btn.dataset.status;
      if (status === "pending") { showToast("Approve the plan before marking actions complete."); return; }
      btn.disabled = true;
      try {
        const action = status === "done" ? "reopen" : "complete";
        const result = await request("/api/task", {taskId:btn.dataset.task, action});
        currentTasks = currentTasks.map(t => t.id === result.task.id ? result.task : t);
        renderTasks(); updateMetrics();
        log(action === "reopen" ? "Action reopened" : "Action completed", result.task.title, action === "reopen" ? "normal" : "success", "PERSISTED TO TASK STORE");
        showToast(result.message);
      } catch(e) { showToast(e.message); btn.disabled = false; }
    }));
    updateMetrics();
  }
  async function loadLatest() {
    try {
      const data = await request("/api/plan");
      currentPlan = data.plan; currentTasks = data.tasks || [];
      if (currentPlan) log("Restored your latest mission", "Loaded the saved plan and task statuses from the backend.", "success", "SESSION RESTORED");
      renderTasks();
    } catch(e) { showToast("Backend not ready yet: " + e.message); }
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); if (busy) return;
    const goal = goalInput.value.trim(); if (goal.length < 8) { showToast("Add a little more detail to your goal."); return; }
    busy = true; planBtn.disabled = true; planBtn.innerHTML = '<span>Building your plan…</span><span>◌</span>';
    $("activity-list").innerHTML = "";
    log("Understanding your goal", "Reading your objective and timeline.", "normal", "STEP 1 OF 3");
    try {
      const data = await request("/api/plan", {goal, startDate:todayISO()});
      currentPlan = data.plan; currentTasks = data.tasks || [];
      log("Plan created", "Generated "+currentTasks.length+" daily actions with categories and time estimates.", "success", "STEP 2 OF 3");
      log("Waiting for your approval", "No task was marked approved or completed. You stay in control.", "normal", "STEP 3 OF 3");
      renderTasks(); showToast("Your action plan is ready for review."); speak("Your seven day action plan is ready. Please review it and approve before marking any action complete.");
      $("plan-panel").scrollIntoView({behavior:"smooth",block:"nearest"});
    } catch(err) { log("Could not create the plan", err.message, "normal", "ACTION NEEDED"); showToast(err.message); }
    finally { busy = false; planBtn.disabled = false; planBtn.innerHTML = '<span>Build my action plan</span><span>↗</span>'; }
  });
  $("approve-btn").addEventListener("click", async () => {
    if (!currentPlan || !currentTasks.length || currentTasks.some(t => t.status === "pending") === false) return;
    const btn = $("approve-btn"); btn.disabled = true;
    try {
      const data = await request("/api/task", {taskId:"all", action:"approve_all"});
      currentTasks = data.tasks || [];
      renderTasks(); log("Plan approved by you", data.message, "success", "APPROVAL RECORDED"); showToast(data.message); speak("Plan approved. You can now mark actions complete as you do them.");
    } catch(e) { showToast(e.message); btn.disabled = false; }
  });
  $("nav-overview").addEventListener("click", () => { $("top").scrollIntoView({behavior:"smooth",block:"start"}); window.scrollTo({top:0,behavior:"smooth"}); });
  $("nav-plan").addEventListener("click", () => $("plan-panel").scrollIntoView({behavior:"smooth",block:"start"}));
  $("nav-activity").addEventListener("click", () => $("activity-list").scrollIntoView({behavior:"smooth",block:"center"}));
  $("help-btn").addEventListener("click", () => $("help-dialog").showModal());
  $("close-help").addEventListener("click", () => $("help-dialog").close());
  $("help-dialog").addEventListener("click", (e) => { if (e.target === $("help-dialog")) $("help-dialog").close(); });
  const speak = (message) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };
  const voiceBtn = $("voice-btn");
  if (voiceBtn) voiceBtn.addEventListener("click", () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast("Voice input is not supported in this browser. Try the latest Chrome, or type your goal.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    voiceBtn.disabled = true;
    voiceBtn.textContent = "Listening…";
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        goalInput.value = transcript;
        showToast("Voice captured. Review the text, then build your plan.");
        speak("I heard your goal. Please review it, then choose build my action plan.");
      }
    };
    recognition.onerror = (event) => showToast(event.error === "not-allowed" ? "Microphone permission was blocked. Allow microphone access and try again." : "I couldn't capture that. Please try again or type your goal.");
    recognition.onend = () => {
      voiceBtn.disabled = false;
      voiceBtn.innerHTML = '<span class="mic-symbol">◔</span> Use voice';
    };
    try { recognition.start(); } catch (e) {
      voiceBtn.disabled = false;
      voiceBtn.innerHTML = '<span class="mic-symbol">◔</span> Use voice';
      showToast("Voice input couldn't start. Please try again.");
    }
  });
  document.querySelectorAll(".starter-chip[data-goal]").forEach((chip) => {
    chip.addEventListener("click", () => {
      goalInput.value = chip.dataset.goal || "";
      goalInput.focus();
      showToast("Starter goal added. Make it yours, then build your roadmap.");
    });
  });

  function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === "signup";
    $("auth-title").textContent = signup ? "Create your workspace." : "Welcome back.";
    $("auth-subtitle").textContent = signup ? "Create an account to keep your plans private and synced." : "Sign in to continue working toward your goals.";
    $("auth-name-wrap").hidden = !signup;
    $("auth-name").required = signup;
    $("auth-submit").textContent = signup ? "Create account" : "Log in";
    $("auth-toggle-copy").textContent = signup ? "Already have an account?" : "New to LifePilot?";
    $("auth-toggle").textContent = signup ? "Log in" : "Create an account";
    $("auth-password").autocomplete = signup ? "new-password" : "current-password";
    $("auth-error").textContent = "";
  }
  function enterWorkspace(user) {
    currentUser = user;
    $("auth-screen").hidden = true;
    $("app-shell").hidden = false;
    $("profile-name").textContent = user.display_name || "My workspace";
    $("profile-email").textContent = user.email || "Signed in";
    $("avatar-letter").textContent = (user.display_name || user.email || "L").trim().charAt(0).toUpperCase();
    renderWeekDates();
    loadLatest();
  }
  function leaveWorkspace() {
    currentUser = null;
    currentPlan = null;
    currentTasks = [];
    $("app-shell").hidden = true;
    $("auth-screen").hidden = false;
    $("goal-input").value = "";
    $("activity-list").innerHTML = '<div class="activity-item"><div class="activity-marker muted">·</div><div><strong>Ready for your first goal</strong><p>Your plan and its changes will appear here, so you always know what happened.</p><small>WAITING FOR INPUT</small></div></div>';
    renderTasks();
    setAuthMode("login");
  }
  $("auth-toggle").addEventListener("click", () => setAuthMode(authMode === "login" ? "signup" : "login"));
  $("auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = $("auth-submit");
    submit.disabled = true;
    $("auth-error").textContent = "";
    const body = {action:authMode, name:$("auth-name").value.trim(), email:$("auth-email").value.trim(), password:$("auth-password").value};
    try {
      const data = await request("/api/auth", body);
      $("auth-password").value = "";
      $("auth-form").reset();
      enterWorkspace(data.user);
      showToast(data.message || "You're signed in.");
    } catch (error) {
      $("auth-error").textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
  async function signOut() {
    const button = $("logout-btn");
    button.disabled = true;
    try {
      await request("/api/auth", {action:"logout"});
      leaveWorkspace();
      showToast("You've signed out.");
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
    }
  }
  $("logout-btn").addEventListener("click", signOut);
  $("logout-top").addEventListener("click", signOut);
  async function initializeAuth() {
    setAuthMode("login");
    $("auth-screen").hidden = false;
    $("app-shell").hidden = true;
    try {
      const response = await fetch("/api/auth", {credentials:"same-origin", cache:"no-store"});
      const data = await response.json();
      if (response.ok && data.user) enterWorkspace(data.user);
    } catch (_) {
      $("auth-error").textContent = "Unable to connect. Please refresh and try again.";
    }
  }

  initializeAuth();
})();