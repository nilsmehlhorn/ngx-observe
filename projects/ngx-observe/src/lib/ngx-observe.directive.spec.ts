import {Component, DebugElement} from '@angular/core'
import {ComponentFixture, TestBed} from '@angular/core/testing'
import {By} from '@angular/platform-browser'
import {BehaviorSubject, defer, Observable, of, Subject, throwError} from 'rxjs'
import {NgxObserveModule} from './ngx-observe.module'

@Component({
  selector: 'ngx-test-component',
  template: `
    <span id="next-value" *ngxObserve="value$ as value; before loading; error error;">
      {{ value }}
    </span>
    <ng-template #loading>
      <span id="loading-text">Loading</span>
    </ng-template>
    <ng-template #error let-error>
      <span id="error-value">{{ error }}</span>
    </ng-template>
  `
})
class TestComponent {
  value$: Observable<string> | undefined
  condition = true
}

describe('ObserveDirective', () => {

  let fixture: ComponentFixture<TestComponent>
  let component: TestComponent
  let el: DebugElement

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxObserveModule],
      declarations: [
        TestComponent
      ]
    })
  })

  const createComponent = (template?: string) => {
    if (template) {
      TestBed.overrideComponent(TestComponent, {set: {template}})
    }
    fixture = TestBed.createComponent(TestComponent)
    component = fixture.componentInstance
    el = fixture.debugElement
  }

  it('should create host', () => {
    createComponent()
    expect(component).toBeDefined()
  })

  it('should render templates', () => {
    createComponent()
    const sink = new Subject<string>()
    component.value$ = sink
    fixture.detectChanges()
    expect(el.query(By.css('#loading-text')).nativeElement.textContent.trim()).toEqual('Loading')
    expect(el.query(By.css('#next-value'))).toBeNull()
    expect(el.query(By.css('#error-value'))).toBeNull()
    sink.next('First')
    fixture.detectChanges()
    expect(el.query(By.css('#loading-text'))).toBeNull()
    expect(el.query(By.css('#error-value'))).toBeNull()
    expect(el.query(By.css('#next-value')).nativeElement.textContent.trim()).toEqual('First')
    sink.next('Second')
    fixture.detectChanges()
    expect(el.query(By.css('#loading-text'))).toBeNull()
    expect(el.query(By.css('#error-value'))).toBeNull()
    expect(el.query(By.css('#next-value')).nativeElement.textContent.trim()).toEqual('Second')
    sink.error('TestError')
    fixture.detectChanges()
    expect(el.query(By.css('#loading-text'))).toBeNull()
    expect(el.query(By.css('#next-value'))).toBeNull()
    expect(el.query(By.css('#error-value')).nativeElement.textContent.trim()).toEqual('TestError')
    component.value$ = of('Third')
    fixture.detectChanges()
    expect(el.query(By.css('#loading-text'))).toBeNull()
    expect(el.query(By.css('#error-value'))).toBeNull()
    expect(el.query(By.css('#next-value')).nativeElement.textContent.trim()).toEqual('Third')
    component.value$ = throwError('OtherTestError')
    fixture.detectChanges()
    expect(el.query(By.css('#loading-text'))).toBeNull()
    expect(el.query(By.css('#next-value'))).toBeNull()
    expect(el.query(By.css('#error-value')).nativeElement.textContent.trim()).toEqual('OtherTestError')
  })

  it('should allow update of templates', () => {
    createComponent(`
        <span id="next-value" *ngxObserve="value$;
        before condition ? loading : otherLoading;
        next condition ? valueTemplate : othervalueTemplate;
        error condition ? error : otherError;"></span>
        <ng-template let-value #valueTemplate>
          <span>Some {{ value }}</span>
        </ng-template>
        <ng-template let-value #othervalueTemplate>
          <span>Other {{ value }}</span>
        </ng-template>
        <ng-template #loading>
          <span>Loading</span>
        </ng-template>
        <ng-template #otherLoading>
          <span>Other Loading</span>
        </ng-template>
        <ng-template #error let-error>
          <span>Some {{ error }}</span>
        </ng-template>
        <ng-template #otherError let-error>
          <span>Other {{ error }}</span>
        </ng-template>
      `)
    const sink = new Subject<string>()
    component.value$ = sink
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent.trim()).toEqual('Loading')
    component.condition = false
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent.trim()).toEqual('Other Loading')
    sink.next('A')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent.trim()).toEqual('Other A')
    component.condition = true
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent.trim()).toEqual('Some A')
    sink.error('Error')
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent.trim()).toEqual('Some Error')
    component.condition = false
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent.trim()).toEqual('Other Error')
  })

  it('should wait for OnInit to subscribe', () => {
    createComponent()
    const sink = new BehaviorSubject('Success')
    component.value$ = sink
    expect(sink.observers.length).toBe(0)
    fixture.detectChanges() // first detection fires OnInit
    expect(sink.observers.length).toBe(1)
  })

  it('should unsubscribe upon destruction', () => {
    createComponent()
    const sink = new BehaviorSubject('Success')
    component.value$ = sink
    fixture.detectChanges()
    expect(sink.observers.length).toBe(1)
    fixture.destroy()
    expect(sink.observers.length).toBe(0)
  })

  it('should not resubscribe to same source', () => {
    createComponent()
    let subscribeCount = 0
    const observable = defer(() => {
      subscribeCount++
      return of('Success')
    })
    component.value$ = observable
    fixture.detectChanges()
    component.value$ = observable
    fixture.detectChanges()
    expect(subscribeCount).toBe(1)
  })

  it('should unsubscribe upon changed source', () => {
    createComponent()
    const sink = new BehaviorSubject('Success')
    component.value$ = sink
    fixture.detectChanges()
    expect(sink.observers.length).toBe(1)
    const otherSink = new BehaviorSubject('Another Success')
    component.value$ = otherSink
    fixture.detectChanges()
    expect(sink.observers.length).toBe(0)
    expect(otherSink.observers.length).toBe(1)
    component.value$ = undefined
    fixture.detectChanges()
    expect(otherSink.observers.length).toBe(0)
  })

})
