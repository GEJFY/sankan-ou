/** Authenticated user */
export interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

/** Auth token response */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** Course (CIA / CISA / CFE) */
export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
}

/** Flashcard */
export interface Card {
  id: string;
  front: string;
  back: string;
  course_id: string;
  topic_id: string;
  is_synergy: boolean;
}

/** Card with FSRS review state */
export interface CardWithReview extends Card {
  state: number;
  due: string;
  difficulty: number;
  stability: number;
  retrievability: number;
}

/** Review submission */
export interface ReviewRequest {
  card_id: string;
  rating: 1 | 2 | 3 | 4;
  response_time_ms: number;
}

/** Dashboard summary per course */
export interface CourseSummary {
  course_id: string;
  course_code: string;
  total_cards: number;
  mastered: number;
  due_today: number;
  pass_probability: number;
}

/** Health check response */
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}
