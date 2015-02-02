import a from 'assert';
import navigation from 'navigation';

var assert = a.assert;
var eq_ = a.eq_;

describe('navigation url extraction', function() {
    it('strips the src query arg', function() {
        eq_(navigation.extract_nav_url('/foo/bar?src=all-popular'), '/foo/bar');
        eq_(navigation.extract_nav_url('/foo/bar?src=all-popular&q=bar'), '/foo/bar?q=bar');
    });
});
