import { supabaseAdmin } from '../config/supabase';
import { claude } from '../config/claude';
import { AppError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class ChallengeService {
  async assignChallenges(matchId: string, userAId: string, userBId: string) {
    // Pick a random active challenge template
    const { data: templates } = await supabaseAdmin
      .from('challenge_templates')
      .select('*')
      .eq('is_active', true);

    if (!templates || templates.length === 0) {
      throw new AppError('No challenge templates available');
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Assign same challenge to both users
    const { error } = await supabaseAdmin
      .from('challenge_instances')
      .insert([
        {
          match_id: matchId,
          template_id: template.id,
          assigned_to_user_id: userAId,
          expires_at: expiresAt.toISOString(),
        },
        {
          match_id: matchId,
          template_id: template.id,
          assigned_to_user_id: userBId,
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (error) throw new AppError(error.message);

    // Update match status
    await supabaseAdmin
      .from('matches')
      .update({ status: 'challenge_active' })
      .eq('id', matchId);
  }

  async getChallenges(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('challenge_instances')
      .select('*, challenge_templates(*)')
      .eq('assigned_to_user_id', userId)
      .in('status', ['pending', 'submitted'])
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message);
    return data || [];
  }

  async submitChallenge(challengeId: string, userId: string, responseText: string) {
    // Get challenge with template
    const { data: challenge, error } = await supabaseAdmin
      .from('challenge_instances')
      .select('*, challenge_templates(*)')
      .eq('id', challengeId)
      .eq('assigned_to_user_id', userId)
      .single();

    if (error || !challenge) throw new NotFoundError('Challenge');
    if (challenge.status !== 'pending') throw new AppError('Challenge already submitted');
    if (new Date(challenge.expires_at) < new Date()) throw new AppError('Challenge expired');

    const template = challenge.challenge_templates;
    const criteria = template.evaluation_criteria;

    // Check minimum word count
    const wordCount = responseText.trim().split(/\s+/).length;
    if (criteria.min_word_count && wordCount < criteria.min_word_count) {
      throw new AppError(`Response must be at least ${criteria.min_word_count} words`);
    }

    // AI evaluation using Claude
    let aiScore = 0.5;
    let aiFeedback = '';

    if (criteria.ai_evaluation) {
      const evaluation = await this.evaluateWithClaude(template.question_text, responseText);
      aiScore = evaluation.score;
      aiFeedback = evaluation.feedback;
    }

    const passed = aiScore >= criteria.pass_threshold;

    // Update challenge instance
    await supabaseAdmin
      .from('challenge_instances')
      .update({
        response_text: responseText,
        ai_score: aiScore,
        ai_feedback: aiFeedback,
        status: passed ? 'passed' : 'failed',
        submitted_at: new Date().toISOString(),
        evaluated_at: new Date().toISOString(),
      })
      .eq('id', challengeId);

    // Check if both users passed — unlock the match
    if (passed) {
      await this.checkAndUnlockMatch(challenge.match_id);
    }

    return { passed, score: aiScore, feedback: aiFeedback };
  }

  private async evaluateWithClaude(question: string, response: string) {
    try {
      const message = await claude.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `You are evaluating a dating app challenge response. Rate the response on sincerity, thoughtfulness, and effort.

Question: "${question}"
Response: "${response}"

Return a JSON object with:
- score: a number between 0.0 and 1.0
- feedback: a brief encouraging comment (1-2 sentences)

Only return the JSON, nothing else.`,
          },
        ],
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const parsed = JSON.parse(text);
      return {
        score: Math.max(0, Math.min(1, parsed.score)),
        feedback: parsed.feedback || 'Thanks for your response!',
      };
    } catch (err) {
      logger.error('Claude evaluation failed', err);
      return { score: 0.5, feedback: 'Response received. Thanks for your effort!' };
    }
  }

  private async checkAndUnlockMatch(matchId: string) {
    const { data: challenges } = await supabaseAdmin
      .from('challenge_instances')
      .select('status, assigned_to_user_id')
      .eq('match_id', matchId);

    if (!challenges) return;

    const allPassed = challenges.every((c) => c.status === 'passed');
    if (allPassed && challenges.length >= 2) {
      await supabaseAdmin
        .from('matches')
        .update({
          status: 'unlocked',
          challenge_unlocked_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      // Update relationship scores for challenge completion
      await supabaseAdmin
        .from('relationship_scores')
        .update({
          trust_score: 10,
          chemistry_score: 5,
          depth_score: 8,
        })
        .eq('match_id', matchId);

      // Log relationship event
      await supabaseAdmin
        .from('relationship_events')
        .insert({
          match_id: matchId,
          event_type: 'challenge_passed',
          score_deltas: { trust: 10, chemistry: 5, depth: 8 },
        });
    }
  }
}

export const challengeService = new ChallengeService();
