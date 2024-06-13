import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';

export enum SQUARE {
  EMPTY_SPACE,
  EMPTY_SNAKE,
  FULL_SNAKE,
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatToolbarModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  title = 'Serpent Vietnamien : Décodez le Mystère';
  puzzleSolved = false;
  private animationInterval: any;

  readonly SNAKE_PATH = [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 2, col: 0 },
    { row: 3, col: 0 },
    { row: 4, col: 0 },
    { row: 5, col: 0 },
    { row: 5, col: 1 },
    { row: 5, col: 2 },

    { row: 4, col: 2 },
    { row: 3, col: 2 },
    { row: 2, col: 2 },
    { row: 1, col: 2 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
    { row: 0, col: 4 },
    { row: 1, col: 4 },

    { row: 2, col: 4 },
    { row: 3, col: 4 },
    { row: 4, col: 4 },
    { row: 5, col: 4 },
    { row: 5, col: 5 },
    { row: 5, col: 6 },
    { row: 4, col: 6 },
    { row: 3, col: 6 },

    { row: 2, col: 6 },
    { row: 1, col: 6 },
    { row: 0, col: 6 },
  ];

  // La grille en 7x6 representant le serpent/puzzle
  SNAKE_GRILLE = [
    [
      SQUARE.EMPTY_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.EMPTY_SNAKE,
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
    ],
    [
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
    ],
    [
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
    ],
    [
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
    ],
    [
      SQUARE.EMPTY_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.EMPTY_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.EMPTY_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.EMPTY_SNAKE,
    ],
    [
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SNAKE,
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SPACE,
      SQUARE.FULL_SNAKE,
      SQUARE.EMPTY_SNAKE,
      SQUARE.FULL_SNAKE,
    ],
  ];

  EMPTY_VALUE = '';
  SNAKE_VALUES = [
    [
      this.EMPTY_VALUE,
      this.EMPTY_VALUE,
      this.EMPTY_VALUE,
      '-',
      this.EMPTY_VALUE,
      this.EMPTY_VALUE,
      '66',
    ],
    ['+', this.EMPTY_VALUE, 'x', this.EMPTY_VALUE, '-', this.EMPTY_VALUE, '='],
    [
      '13',
      this.EMPTY_VALUE,
      '12',
      this.EMPTY_VALUE,
      '11',
      this.EMPTY_VALUE,
      '10',
    ],
    ['x', this.EMPTY_VALUE, '+', this.EMPTY_VALUE, '+', this.EMPTY_VALUE, '-'],
    [
      this.EMPTY_VALUE,
      this.EMPTY_VALUE,
      this.EMPTY_VALUE,
      this.EMPTY_VALUE,
      this.EMPTY_VALUE,
      this.EMPTY_VALUE,
      this.EMPTY_VALUE,
    ],
    [':', this.EMPTY_VALUE, '+', this.EMPTY_VALUE, 'x', this.EMPTY_VALUE, ':'],
  ];

  // Ou sont les cases à remplir par les tentatives de résolution du puzzle
  readonly GUESS_POSITIONS = [
    { row: 0, col: 0 },
    { row: 4, col: 0 },
    { row: 5, col: 1 },
    { row: 4, col: 2 },
    { row: 0, col: 2 },
    { row: 0, col: 4 },
    { row: 4, col: 4 },
    { row: 5, col: 5 },
    { row: 4, col: 6 },
  ];

  solutions: string[][] = [];
  valeursPossible = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  readonly TARGET_SUM = 66;
  currentSolutionIndex: number = 0;
  currentCombinationIndex: string[] = [];
  displayedSolutionCount: number = 0;

  ngOnInit(): void {
    this.currentCombinationIndex = Array(this.GUESS_POSITIONS.length).fill(
      '?'
    );
    this.solutions = this.bruteForce([], []);
  }

  ngAfterViewInit(): void {
    // setting up the refresh interval caused a timeout in prerendering, so only set up interval if rendering in browser
    if (isPlatformBrowser(this.platformId)) {
      this.startResolveAnimation();
      this.startSnakeAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  get solutionHeader(): string {
    const count = this.solutions.length;
    return `${count} solution${count > 0 ? 's' : ''}`;
  }

  calculateSolutions(): void {
    if (this.puzzleSolved) return;

    // this.solutions = this.bruteForce([], []);

    this.puzzleSolved = true;
  }

  bruteForce(currentCombination: string[], solutions: string[][]): string[][] {
    if (currentCombination.length === 9) {
      const values = currentCombination.map(Number);
      const equationValue =
        values[0] +
        (13 * values[1]) / values[2] +
        values[3] +
        12 * values[4] -
        values[5] -
        11 +
        (values[6] * values[7]) / values[8] -
        10;

      this.currentCombinationIndex = [...currentCombination];

      if (equationValue === this.TARGET_SUM) {
        solutions.push([...currentCombination]);
      }
    } else {
      const remainingValues = this.valeursPossible.filter(
        (v) => !currentCombination.includes(v)
      );
      for (const value of remainingValues) {
        const newCombination = [...currentCombination, value];
        solutions = this.bruteForce(newCombination, solutions);
      }
    }
    return solutions;
  }

  getBoxValue(rowIndex: number, colIndex: number): string {
    const value = this.SNAKE_VALUES[rowIndex][colIndex];

    if (this.EMPTY_VALUE === value && this.currentCombinationIndex.length > 0) {
      for (let i = 0; i < this.GUESS_POSITIONS.length; i++) {
        if (
          this.GUESS_POSITIONS[i].row === rowIndex &&
          this.GUESS_POSITIONS[i].col === colIndex
        ) {
          return this.currentCombinationIndex[i];
        }
      }
    }
    return value;
  }

  getBoxClass(value: SQUARE, rowIndex: number, colIndex: number): string {
    let className = '';
    switch (value) {
      case SQUARE.EMPTY_SPACE:
        className = 'empty-space';
        break;
      case SQUARE.EMPTY_SNAKE:
        className = 'empty-snake';
        break;
      case SQUARE.FULL_SNAKE:
        className = 'full-snake';
        break;
    }
    if (this.isHead(rowIndex, colIndex)) {
      className += ' head';
    } else if (this.isTail(rowIndex, colIndex)) {
      className += ' tail';
    }
    return className;
  }

  isHead(rowIndex: number, colIndex: number): boolean {
    return rowIndex === 0 && colIndex === 6;
  }

  isTail(rowIndex: number, colIndex: number): boolean {
    return rowIndex === 0 && colIndex === 0;
  }

  nextSolution(): void {
    if (this.solutions.length > 0) {
      this.currentSolutionIndex =
        (this.currentSolutionIndex + 1) % this.solutions.length;
      this.currentCombinationIndex = this.solutions[this.currentSolutionIndex];
      this.displayedSolutionCount = this.currentSolutionIndex + 1;
    }
  }

  startResolveAnimation(): void {
    this.animationInterval = setInterval(() => {
      this.nextSolution();
    }, 50);
  }

  startSnakeAnimation() {
    this.SNAKE_PATH.forEach((pos, index) => {
      const selector = `.box[data-row="${pos.row}"][data-col="${pos.col}"]`;
      const box = this.document.querySelector(selector);
      if (box) {
        box.classList.add('wave');
        box.classList.add(`body-part-${index}`);
      }
    });
  }

  // startMovingSnakeAnimation() {
  //   let currentIndex = 0;

  //   this.animationSnakeInterval = setInterval(() => {
  //     const boxes = this.document.querySelectorAll('.box');
  //     Array.from(boxes).forEach((box: Element) => {
  //       this.renderer.removeClass(box, 'hover');
  //     });

  //     for (let i = 0; i < 3; i++) {
  //       const index = (currentIndex + i) % this.SNAKE_PATH.length;
  //       const { row, col } = this.SNAKE_PATH[index];
  //       const selector = `.box[data-row="${row}"][data-col="${col}"]`;
  //       const box = this.document.querySelector(selector);
  //       if (box) {
  //         this.renderer.addClass(box, 'hover');
  //       }
  //     }

  //     currentIndex = (currentIndex + 1) % this.SNAKE_PATH.length;
  //   }, 1000);
  // }
}
