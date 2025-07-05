import { Component, OnInit, ViewChild } from '@angular/core';
import { ChannelService } from 'src/app/services/channel.service'; // Adjust the path as necessary
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component'; // Adjust the path as necessary
import { environment } from 'src/environments/environment';
import { CreateChannelComponent } from '../create-channel/create-channel.component';
@Component({
  selector: 'app-channel-list',
  templateUrl: './channel-list.component.html',
  styleUrls: ['./channel-list.component.scss']
})
export class ChannelListComponent implements OnInit {
  channels: any[] = [];
  filteredChannels: any[] = [];
  loading: boolean = false;
  showCreateChannel: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 5; // Number of items per page
  searchTerm: string = '';
  sortColumn: string = '';
  sortOrder: 'asc' | 'desc' = 'asc';
  public baseUrl: string = environment.backendUrl;
  @ViewChild('createChannelComponent') createChannelComponent!: CreateChannelComponent;

  constructor(
    private channelService: ChannelService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.fetchChannels();
  }

  fetchChannels(): void {
    this.loading = true;
    this.channelService.getChannel().subscribe(
      (response) => {
        this.channels = response.data.results;
        this.filteredChannels = this.channels; // Initialize filtered channels
        this.loading = false;
      },
      (error) => {
        this.toastr.error('Failed to load channels');
        this.loading = false;
      }
    );
  }

  filterChannels(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredChannels = this.channels.filter(channel =>
      channel.name.toLowerCase().includes(term) ||
      channel.description.toLowerCase().includes(term)
    );
  }

  sort(column: string): void {
    this.sortOrder = this.sortColumn === column && this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortColumn = column;

    this.filteredChannels.sort((a, b) => {
      return this.sortOrder === 'asc' ? (a[column] > b[column] ? 1 : -1) : (a[column] < b[column] ? 1 : -1);
    });
  }

  openConfirmDialog(channelId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: { id: channelId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteChannel(channelId);
      }
    });
  }

  deleteChannel(channelId: number): void {
    this.channelService.deleteChannel(channelId).subscribe(
      (response) => {
        this.toastr.success(response.message);
        this.fetchChannels(); // Refresh the channel list
      },
      (error) => {
        this.toastr.error('Failed to delete channel');
      }
    );
  }

  onChannelCreated(): void {
    this.fetchChannels(); // Refresh the channel list when a new channel is created
  }

  getChannelImage(imagePath: string): string {
    return `${this.baseUrl}${imagePath}`;
  }

  editChannel(channel: any): void {
    this.showCreateChannel = true;
    channel.imageUrl = this.getChannelImage(channel.profile_image);
    if (this.createChannelComponent) {
      this.createChannelComponent.editChannel(channel);
    }
  }
}