import {
  ChangeDetectorRef,
  Directive,
  EmbeddedViewRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  ɵstringify as stringify
} from '@angular/core'
import {AsyncSubject, Observable, Subject} from 'rxjs'
import {concatMap, takeUntil} from 'rxjs/operators'

function assertTemplate(property: string, templateRef: TemplateRef<any> | null): void {
  const isTemplateRefOrNull = !!(!templateRef || templateRef.createEmbeddedView)
  if (!isTemplateRefOrNull) {
    throw new Error(`${property} must be a TemplateRef, but received '${stringify(templateRef)}'.`)
  }
}

export class ObserveContext<T = any> {
  $implicit: T
  ngxObserve: T

  constructor(value: T) {
    this.$implicit = value
    this.ngxObserve = value
  }
}

export class ErrorContext {
  $implicit: Error

  constructor(error: Error) {
    this.$implicit = error
  }
}

@Directive({
    selector: '[ngxObserve]',
    standalone: false
})
export class NgxObserveDirective<T = any> implements OnDestroy, OnInit {

  private nextTemplateRef: TemplateRef<ObserveContext<T>>
  private errorTemplateRef: TemplateRef<ErrorContext>
  private beforeTemplateRef: TemplateRef<undefined>
  private nextViewRef: EmbeddedViewRef<ObserveContext<T>> | undefined
  private errorViewRef: EmbeddedViewRef<ErrorContext> | undefined
  private beforeViewRef: EmbeddedViewRef<undefined> | undefined
  private unsubscribe = new Subject<void>()
  private init = new AsyncSubject<void>()
  private source: Observable<T>

  constructor(
    private view: ViewContainerRef,
    private changes: ChangeDetectorRef,
    nextTemplateRef: TemplateRef<ObserveContext<T>>
  ) {
    this.nextTemplateRef = nextTemplateRef
  }

  @Input()
  set ngxObserve(source: Observable<T>) {
    if (this.source && source !== this.source) {
      this.unsubscribe.next(undefined)
    }
    if (source && source !== this.source) {
      if (this.beforeTemplateRef) {
        this.view.clear()
        this.nextViewRef = undefined
        this.errorViewRef = undefined
        this.beforeViewRef = this.view.createEmbeddedView(this.beforeTemplateRef)
      }
      this.init.pipe(
        concatMap(() => {
          if (this.beforeTemplateRef) {
            this.view.clear()
            this.nextViewRef = undefined
            this.errorViewRef = undefined
            this.beforeViewRef = this.view.createEmbeddedView(this.beforeTemplateRef)
          }
          return source
        }),
        takeUntil(this.unsubscribe)
      ).subscribe(value => {
        this.view.clear()
        this.errorViewRef = undefined
        this.beforeViewRef = undefined
        this.nextViewRef = this.view.createEmbeddedView(this.nextTemplateRef, new ObserveContext<T>(value))
        this.changes.markForCheck()
      }, error => {
        if (this.errorTemplateRef) {
          this.view.clear()
          this.beforeViewRef = undefined
          this.nextViewRef = undefined
          this.errorViewRef = this.view.createEmbeddedView(this.errorTemplateRef, new ErrorContext(error))
          this.changes.markForCheck()
        }
      })
    }
    this.source = source
  }

  @Input()
  set ngxObserveError(ref: TemplateRef<ErrorContext>) {
    assertTemplate('ngxObserveError', ref)
    this.errorTemplateRef = ref
    if (this.errorViewRef) {
      this.view.clear()
      this.errorViewRef = this.view.createEmbeddedView(this.errorTemplateRef, this.errorViewRef.context)
    }
  }

  @Input()
  set ngxObserveBefore(ref: TemplateRef<undefined>) {
    assertTemplate('ngxObserveBefore', ref)
    this.beforeTemplateRef = ref
    if (this.beforeViewRef) {
      this.view.clear()
      this.beforeViewRef = this.view.createEmbeddedView(this.beforeTemplateRef)
    }
  }

  @Input()
  set ngxObserveNext(ref: TemplateRef<ObserveContext<T>>) {
    assertTemplate('ngxObserveNext', ref)
    this.nextTemplateRef = ref
    if (this.nextViewRef) {
      this.view.clear()
      this.nextViewRef = this.view.createEmbeddedView(this.nextTemplateRef, this.nextViewRef.context)
      this.changes.markForCheck()
    }
  }

  static ngTemplateContextGuard<T>(dir: NgxObserveDirective<T>, ctx: any): ctx is ObserveContext<T> {
    return true
  }

  ngOnDestroy() {
    this.unsubscribe.next(undefined)
  }

  ngOnInit() {
    this.init.next(undefined)
    this.init.complete()
  }

}
