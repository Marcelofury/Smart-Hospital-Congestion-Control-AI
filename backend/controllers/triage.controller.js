const { evaluateRuleBasedTriage, evaluateWithAI } = require('../services/triage.service');
const { ai } = require('../config/gemini');

class TriageController {
  async evaluateTriage(req, res) {
    try {
      const { patientName, age, symptoms, vitals, hospitalCapacity } = req.body;

      if (!symptoms || typeof symptoms !== 'string') {
        return res.status(400).json({ error: 'Symptoms description is required' });
      }

      if (!ai) {
        const evaluation = evaluateRuleBasedTriage(symptoms, Number(age) || 35, vitals, hospitalCapacity);
        return res.json(evaluation);
      }

      try {
        const parsed = await evaluateWithAI(req.body);
        
        if (parsed.triage_urgency === 'Non-Urgent') {
          if (parsed.wait_strategy === 'Report Directly to Triage Bed' || parsed.wait_strategy === 'Wait in Waiting Room') {
            parsed.wait_strategy = 'Wait at Home';
            parsed.recommended_arrival_time = 'Staggered Arrival: Return in 45 minutes at ' + new Date(Date.now() + 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            parsed.congestion_mitigation_action = 'Enforce remote queue. Physical waiting room capacity is preserved.';
          }
        }
        return res.json(parsed);
      } catch (err) {
        console.error('AI evaluation failed, using fallback:', err.message);
        const fallback = evaluateRuleBasedTriage(symptoms, Number(age) || 35, vitals, hospitalCapacity);
        return res.json(fallback);
      }
    } catch (err) {
      console.error('Triage evaluation error:', err);
      const fallback = evaluateRuleBasedTriage(
        req.body?.symptoms || '',
        Number(req.body?.age) || 35,
        req.body?.vitals,
        req.body?.hospitalCapacity
      );
      return res.json(fallback);
    }
  }

  async healthCheck(req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }
}

module.exports = new TriageController();
