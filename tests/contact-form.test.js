const test = require('node:test');
const assert = require('node:assert/strict');
const { buildContactDraft } = require('../scripts/contact-form');

test('contact draft preserves message and safely encodes subject and body', () => {
  const draft = buildContactDraft({name:'Test User',email:'test@example.com',category:'technical',subject:'A & B?',message:'Line 1\nLine 2 + #'});
  const url = new URL(draft);
  assert.equal(url.pathname, 'admin@nplcricketleague.com');
  assert.equal(url.searchParams.get('subject'), 'A & B?');
  assert.ok(url.searchParams.get('body').includes('Line 1\nLine 2 + #'));
  assert.ok(url.searchParams.get('body').includes('Reply email: test@example.com'));
});

test('partnership draft uses the published partnership address', () => {
  assert.ok(buildContactDraft({category:'partnership',name:'',email:'',subject:'',message:''}).startsWith('mailto:partnerships@nplcricketleague.com?'));
});
