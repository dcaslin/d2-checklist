export interface ApiResponse<T> {
  ErrorCode: number;
  ErrorStatus: string;
  Message: string;
  MessageData: any;
  Response: T; // Payload
  ThrottleSeconds: number
}

export interface DisplayProperties {
  description: string;
  icon: string;
  name: string;
}
