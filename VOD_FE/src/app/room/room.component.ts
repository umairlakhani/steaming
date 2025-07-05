import { Component, OnInit } from '@angular/core';
import {  ActivatedRoute } from '@angular/router';
import {Socket} from 'ngx-socket-io'
import {v4 as uuidv4} from 'uuid'

declare const Peer: new (arg0: any, arg1: {host:string; port:number;}) => any;
interface VideoElement{
  muted:boolean;
  srcObject:MediaStream;
  userId:string
}
@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {
  currentUserId:string = uuidv4();
  videos:VideoElement[] = []
  constructor(
    private route:ActivatedRoute,
    private socket :Socket
  ){}
  ngOnInit(): void {
    const myPeer = new Peer(this.currentUserId,{
      host:'/',
      port:3001
    })
    this.route.params.subscribe((params)=>{
      console.log(params,"params")
      myPeer.on('open',(userId:any)=>{
        this.socket.emit('join-room',params['roomId'],userId)
      })
    })

    navigator.mediaDevices.getUserMedia({
      audio:true,
      video:true
    })
    .catch((err)=>{
      console.error(err,"errorr")
      return null
    })
    .then((stream:MediaStream | null)=>{
      if(stream){
        this.addMyVideo(stream);
      }
    

    myPeer.on('call',(call:any
      // {answer:(arg0:MediaStream | null)=> void; on:(arg1:MediaStream |null)=>any}
      )=>{
      call.answer(stream);

      call.on('stream',(otherUserVideoStream:MediaStream)=>{
        console.log(otherUserVideoStream,"otherUserVideoStream")
          this.addOtherUserVideo(call.metadata.userId,otherUserVideoStream)
      })
      call.on('error',(err:any)=>{
        console.error(err)
      })
    })

    this.socket.on('user-connected',(userId:string)=>{
      setTimeout(()=>{
        const call = myPeer.call(userId,stream,{
          metadata:{userId:this.currentUserId}
        })
        call.on('stream',(otherUserVideoStream:MediaStream)=>{
        this.addOtherUserVideo(userId,otherUserVideoStream)
        })
        call.on('close',()=>{
          this.videos = this.videos.filter((video)=>video.userId!==userId)
        })
      },1000)
    })
  })
    this.socket.on('user-disconnected',(userId:string)=>{
      this.videos = this.videos.filter(video=>video.userId !==userId)
    })
  }

  addMyVideo(stream:MediaStream){
    this.videos.push({
      muted:true,
      srcObject:stream,
      userId:this.currentUserId
    })
  }

  addOtherUserVideo(userId:string,stream:MediaStream){
    const alreadyExisting = this.videos.some(video=>video.userId === userId)
    if(alreadyExisting){
      return
    }
    this.videos.push({
      muted:false,
  srcObject:stream,
    userId
    })
  }
  onLoadedMetadata(event:Event){
    (event.target as HTMLVideoElement).play()
  }
}
