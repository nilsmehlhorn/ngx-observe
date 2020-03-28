[![npm-badge](https://img.shields.io/npm/v/ngx-observe.svg?style=flat-square)](https://www.npmjs.com/package/ngx-observe)
&nbsp;
[![travis-badge](https://img.shields.io/travis/nilsmehlhorn/ngx-observe/master.svg?style=flat-square)](https://travis-ci.org/nilsmehlhorn/ngx-observe)
&nbsp;
[![codecov-badge](https://codecov.io/gh/nilsmehlhorn/ngx-observe/branch/master/graph/badge.svg)](https://codecov.io/gh/nilsmehlhorn/ngx-observe)

ngx-observe is an Angular structural directive with first-class support for observables.

🧩 designated loading & error templates
⚠️ access to errors
✅ support for falsy values
🚀 OnPush ready

⚡ [Example StackBlitz](https://stackblitz.com/github/nilsmehlhorn/ngx-observe-example)

You can find an in-depth explanation [here](https://nils-mehlhorn.de/posts/angular-observable-directive/).

## Installation

```bash
npm i ngx-observe
```

## Usage

Import `NgxObserveModule`:
```typescript
import { NgxObserveModule } from 'ngx-observe';

@NgModule({
  imports: [
    ...
    NgxObserveModule 
  ],
  ...
})
export class AppModule { }
```

Bind observable with [Angular microsyntax](https://angular.io/guide/structural-directives#microsyntax). You might also then configure your component to use OnPush-ChangeDetection.
```typescript
@Component({
  ...
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent  {
  users$: Observable<User>

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.users$ = this.http.get<User[]>('/users')
  }
}
```
```html
<p *ngxObserve="users$ as users; before loadingTemplate; error errorTemplate">
  There are {{ users.length }} online.
</p>
<ng-template #loadingTemplate>
  <p>Loading ...</p>
</ng-template>
<ng-template #errorTemplate let-error>
  <p>{{ error }}</p>
</ng-template>
```
| Input | Type | Description
| ---   | ---         | --- |
| ngxObserve | `Observable<T>` | Observable to display |
| ngxObserveBefore | `TemplateRef<undefined>` | Template to display before observable emits first value |
| ngxObserveError | `TemplateRef<ErrorContext>` | Template to display when observable errors |
| ngxObserveNext | `TemplateRef<ObserveContext>` | Template to display for emitted values |
