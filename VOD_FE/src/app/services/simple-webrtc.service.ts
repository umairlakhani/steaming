import { Injectable } from '@angular/core';
// import SimpleWebRTC from 'simplewebrtc';

declare const SimpleWebRTC: any;
@Injectable({
  providedIn: 'root',
})
export class SimpleWebRTCService {
//   private webrtc: SimpleWebRTC;
  private webrtc: any;

  constructor() {
    // Configure SimpleWebRTC
    this.webrtc = new SimpleWebRTC({
      // Provide the URL of your signaling server
      url: 'http://localhost:4000',
    });
  }

  
//   getWebRTCInstance(): any {
//     return this.webrtc;
//   }
//   joinRoom(roomId: string): void {
//     this.webrtc.joinRoom(roomId);
//   }
//   sendSignal(data: any, targetClientId?: string): void {
//     this.webrtc.sendToAll('signal', data, targetClientId);
//   }
//   onSignal(callback: (data: any, client: any) => void): void {
//     this.webrtc.connection.on('signal', callback);
//   }
//   onStreamAdded(callback: (stream: MediaStream, client: any) => void): void {
//     this.webrtc.on('videoAdded', (videoElement: HTMLVideoElement, client: any) => {
//       const stream = videoElement.srcObject as MediaStream;
//       callback(stream, client);
//     });
//   }
  
//   onStreamRemoved(callback: (stream: MediaStream, client: any) => void): void {
//     this.webrtc.on('videoRemoved', (videoElement: HTMLVideoElement, client: any) => {
//       const stream = videoElement.srcObject as MediaStream;
//       callback(stream, client);
//     });
//   }
  // Add additional methods to handle SimpleWebRTC functionality
}