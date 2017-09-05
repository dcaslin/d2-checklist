import { D2ChecklistStarterPage } from './app.po';

describe('d2-checklist App', () => {
  let page: D2ChecklistStarterPage;

  beforeEach(() => {
    page = new D2ChecklistStarterPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
