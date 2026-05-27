export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string;
          external_key: string;
          prompt: string;
          options: Json;
          correct_answer_index: number;
          category: string;
          difficulty_band: "easy" | "medium" | "hard";
          pressure_tag: "calm" | "neutral" | "spiky";
          is_active: boolean;
          question_set_version: string;
          source_label: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_key: string;
          prompt: string;
          options: Json;
          correct_answer_index: number;
          category: string;
          difficulty_band: "easy" | "medium" | "hard";
          pressure_tag: "calm" | "neutral" | "spiky";
          is_active?: boolean;
          question_set_version: string;
          source_label?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_key?: string;
          prompt?: string;
          options?: Json;
          correct_answer_index?: number;
          category?: string;
          difficulty_band?: "easy" | "medium" | "hard";
          pressure_tag?: "calm" | "neutral" | "spiky";
          is_active?: boolean;
          question_set_version?: string;
          source_label?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          created_at: string;
          updated_at: string;
          display_name: string | null;
          best_score_rank: number;
          current_streak: number;
          last_played_at: string | null;
          best_run_id: string | null;
        };
        Insert: {
          user_id: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          best_score_rank?: number;
          current_streak?: number;
          last_played_at?: string | null;
          best_run_id?: string | null;
        };
        Update: {
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          best_score_rank?: number;
          current_streak?: number;
          last_played_at?: string | null;
          best_run_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_best_run_id_fkey";
            columns: ["best_run_id"];
            referencedRelation: "runs";
            referencedColumns: ["id"];
          }
        ];
      };
      runs: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          started_at: string;
          completed_at: string;
          outcome: "eliminated" | "completed";
          highest_rank: number;
          correct_answers: number;
          total_questions: number;
          failure_reason: "wrong-answer" | "timeout" | null;
          best_reserve_seconds: number | null;
          question_set_version: string;
          avg_response_time_ms: number | null;
          avg_first_selection_time_ms: number | null;
          selection_change_rate: number | null;
          pressure_miss_count: number;
          timeout_count: number;
          category_summary: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          started_at: string;
          completed_at: string;
          outcome: "eliminated" | "completed";
          highest_rank: number;
          correct_answers: number;
          total_questions: number;
          failure_reason?: "wrong-answer" | "timeout" | null;
          best_reserve_seconds?: number | null;
          question_set_version: string;
          avg_response_time_ms?: number | null;
          avg_first_selection_time_ms?: number | null;
          selection_change_rate?: number | null;
          pressure_miss_count?: number;
          timeout_count?: number;
          category_summary?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          started_at?: string;
          completed_at?: string;
          outcome?: "eliminated" | "completed";
          highest_rank?: number;
          correct_answers?: number;
          total_questions?: number;
          failure_reason?: "wrong-answer" | "timeout" | null;
          best_reserve_seconds?: number | null;
          question_set_version?: string;
          avg_response_time_ms?: number | null;
          avg_first_selection_time_ms?: number | null;
          selection_change_rate?: number | null;
          pressure_miss_count?: number;
          timeout_count?: number;
          category_summary?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "runs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      run_question_signals: {
        Row: {
          id: string;
          run_id: string;
          user_id: string;
          question_id: string;
          question_rank: number;
          category: string;
          result: "correct" | "incorrect" | "timeout";
          correct_answer_index: number;
          selected_answer_index: number | null;
          locked_answer_index: number | null;
          response_time_ms: number;
          first_selection_time_ms: number | null;
          selection_change_count: number;
          time_remaining_at_lock: number | null;
          locked_with_under_5s: boolean;
          timed_out_without_lock: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          user_id: string;
          question_id: string;
          question_rank: number;
          category: string;
          result: "correct" | "incorrect" | "timeout";
          correct_answer_index: number;
          selected_answer_index?: number | null;
          locked_answer_index?: number | null;
          response_time_ms: number;
          first_selection_time_ms?: number | null;
          selection_change_count?: number;
          time_remaining_at_lock?: number | null;
          locked_with_under_5s?: boolean;
          timed_out_without_lock?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          user_id?: string;
          question_id?: string;
          question_rank?: number;
          category?: string;
          result?: "correct" | "incorrect" | "timeout";
          correct_answer_index?: number;
          selected_answer_index?: number | null;
          locked_answer_index?: number | null;
          response_time_ms?: number;
          first_selection_time_ms?: number | null;
          selection_change_count?: number;
          time_remaining_at_lock?: number | null;
          locked_with_under_5s?: boolean;
          timed_out_without_lock?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "run_question_signals_run_id_fkey";
            columns: ["run_id"];
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "run_question_signals_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      player_models: {
        Row: {
          user_id: string;
          created_at: string;
          updated_at: string;
          runs_observed: number;
          questions_observed: number;
          accuracy_rate: number;
          timeout_rate: number;
          avg_response_time_ms: number | null;
          avg_first_selection_time_ms: number | null;
          avg_selection_change_count: number;
          pressure_accuracy_rate: number;
          pressure_timeout_rate: number;
          confidence_style: string;
          hesitation_style: string;
          pressure_style: string;
          category_snapshot: Json;
          model_version: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
          updated_at?: string;
          runs_observed?: number;
          questions_observed?: number;
          accuracy_rate?: number;
          timeout_rate?: number;
          avg_response_time_ms?: number | null;
          avg_first_selection_time_ms?: number | null;
          avg_selection_change_count?: number;
          pressure_accuracy_rate?: number;
          pressure_timeout_rate?: number;
          confidence_style?: string;
          hesitation_style?: string;
          pressure_style?: string;
          category_snapshot?: Json;
          model_version?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          runs_observed?: number;
          questions_observed?: number;
          accuracy_rate?: number;
          timeout_rate?: number;
          avg_response_time_ms?: number | null;
          avg_first_selection_time_ms?: number | null;
          avg_selection_change_count?: number;
          pressure_accuracy_rate?: number;
          pressure_timeout_rate?: number;
          confidence_style?: string;
          hesitation_style?: string;
          pressure_style?: string;
          category_snapshot?: Json;
          model_version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_models_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
