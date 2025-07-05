import { Component, TemplateRef, OnInit } from '@angular/core';
import { NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { PaginationInstance } from 'ngx-pagination';

@Component({
  selector: 'app-archive2',
  templateUrl: './archive2.component.html',
  styleUrls: ['./archive2.component.scss'],
})
export class Archive2Component implements OnInit {
  constructor(private modalService: NgbModal) {}

  ngOnInit() {
    this.setPage(1);
  }

  items: Array<{ id: string; url: string; title: string }> = [
    {
      id: '0',
      url: 'src/assets/schedules/image 1.png',
      title: 'SO1E86 BOTP movie'
    },
    {
      id: '1',
      url: 'src/assets/schedules/image 2.png',
      title: 'SO1E86 BOTP movie'
    },
    {
      id: '2',
      url: 'src/assets/schedules/image 3.png',
      title: 'SO1E86 BOTP movie'
    },
    {
      id: '2',
      url: 'src/assets/schedules/image 3.png',
      title: 'SO1E86 BOTP movie'
    },
    {
      id: '2',
      url: 'src/assets/schedules/image 3.png',
      title: 'SO1E86 BOTP movie'
    },
    {
      id: '2',
      url: 'src/assets/schedules/image 3.png',
      title: 'SO1E86 BOTP movie'
    },
    {
      id: '2',
      url: 'src/assets/schedules/image 3.png',
      title: 'SO1E86 BOTP movie'
    },
    {
      id: '2',
      url: 'src/assets/schedules/image 3.png',
      title: 'SO1E86 BOTP movie'
    },
  ];

  pagedItems: Array<{ id: string; url: string; title: string }> = [];

  // pagination
  pageConfig: PaginationInstance = {
    id: 'items-pagination',
    itemsPerPage: 6,
    currentPage: 1
  };
  currentPage: number = 1;
  totalPages!: number;
  pages: number[] = [1];

  setPage(page: number) {
    this.currentPage = page;
    const startIndex = (page - 1) * this.pageConfig.itemsPerPage;
    const endIndex = startIndex + this.pageConfig.itemsPerPage;
    this.pagedItems = this.items.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.items.length / this.pageConfig.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.setPage(page);
  }

  // openPublishModal(// add content: TemplateRef<any>) {
  //   const modalOptions: NgbModalOptions = {
  //     backdrop: 'static',
  //     keyboard: false
  //   };
  //   this.modalService.open(content, modalOptions);
  // }
}
