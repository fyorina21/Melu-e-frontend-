const fs = require("fs");
let content = fs.readFileSync("src/screens/programdirector/IupGenerationScreen.tsx", "utf-8");

const target = `  const handleSelectGoal = async (goal: GoalBankItem) => {
    if (!selectorTarget || goal.active === false) return;
    const { station, slotIndex } = selectorTarget;
    
    let newSlots: Slots | null = null;
    setSlots((prev) => {
      const next: Slots = { ...prev };
      next[station] = [...prev[station]];
      next[station][slotIndex] = goal;
      newSlots = next;
      return next;
    });

    if (selectedStudentId) {
      try {
        const stationNumber = station === 'station1' ? 1 : 2;
        await assignGoalToSlot(selectedStudentId, { goalId: goal.id, station: stationNumber, slot: slotIndex });
        
        if (newSlots) {
          await saveIupDraft(selectedStudentId, {
            slots: newSlots,
            reinforcementSchedule,
            crisisProtocol,
            accommodations,
            reviewCycle,
            customFields: customIupValues,
          });
          setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          showToast('Goal assigned and draft saved successfully.', 'success');
        }
      } catch (err) {
        console.error('Failed to assign goal or save draft:', err);
        showToast('Failed to save changes.', 'error');
      }
    }
  };`;

const replacement = `  const handleSelectGoal = async (goal: GoalBankItem) => {
    if (!selectorTarget || goal.active === false) return;
    const { station, slotIndex } = selectorTarget;

    const allCurrentGoals = [...slots.station1, ...slots.station2].filter(Boolean);
    if (allCurrentGoals.some(g => g?.id === goal.id)) {
      if (typeof window !== 'undefined') {
        window.alert('This goal is already assigned. Please select a different goal.');
      } else {
        Alert.alert('Duplicate Goal', 'This goal is already assigned. Please select a different goal.');
      }
      return;
    }
    
    let newSlots: Slots | null = null;
    setSlots((prev) => {
      const next: Slots = { ...prev };
      next[station] = [...prev[station]];
      next[station][slotIndex] = goal;
      newSlots = next;
      return next;
    });

    setSelectorTarget(null);

    if (selectedStudentId) {
      try {
        const stationNumber = station === 'station1' ? 1 : 2;
        await assignGoalToSlot(selectedStudentId, { goalId: goal.id, station: stationNumber, slot: slotIndex });
        
        if (newSlots) {
          await saveIupDraft(selectedStudentId, {
            slots: newSlots,
            reinforcementSchedule,
            crisisProtocol,
            accommodations,
            reviewCycle,
            customFields: customIupValues,
          });
          setLastSavedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          showToast('Goal assigned and draft saved successfully.', 'success');
        }
      } catch (err) {
        console.error('Failed to assign goal or save draft:', err);
        showToast('Failed to save changes.', 'error');
      }
    }
  };`;

fs.writeFileSync("src/screens/programdirector/IupGenerationScreen.tsx", content.replace(target, replacement));
console.log("Success");

