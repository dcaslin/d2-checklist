export interface ApiResponse<T> {
  ErrorCode: number;
  ErrorStatus: string;
  Message: string;
  MessageData: any;
  Response: T; // Payload
  ThrottleSeconds: number
}
