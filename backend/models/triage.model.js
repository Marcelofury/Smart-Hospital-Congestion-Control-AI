const TriageResult = {
  isValid: (data) => {
    return data && 
           typeof data.triage_urgency === 'string' &&
           ['Emergency', 'Urgent', 'Non-Urgent'].includes(data.triage_urgency) &&
           typeof data.wait_strategy === 'string';
  }
};

module.exports = TriageResult;
