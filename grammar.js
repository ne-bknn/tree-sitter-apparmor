/**
 * @file AppArmor grammar for tree-sitter
 * @author Timofei Mishchenko
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'apparmor',

  extras: $ => [/\t|[ ]/, $.comment],

  rules: {
    source_file: $ => repeat(choice(
      $.comment_line,
      $.include_line,
      $.abi_line,
      $.tunables_assignment_line,
      $.conditional_var_assignment_line,
      $.alias_line,
      // Allow common rule lines at top level to support abstractions
      $.file_rule_line,
      $.exec_rule_line,
      $.alias_rule_line,
      $.capability_rule_line,
      $.network_rule_line,
      $.ptrace_rule_line,
      $.signal_rule_line,
      $.mount_rule_line,
      $.remount_rule_line,
      $.userns_rule_line,
      $.umount_rule_line,
      $.pivot_root_rule_line,
      $.dbus_rule_line,
      $.unix_rule_line,
      $.link_rule_line,
      $.change_profile_rule_line,
      $.all_rule_line,
      $.mqueue_rule_line,
      $.io_uring_rule_line,
      $.rlimit_rule_line,
      $.file_directive_line,
      $.profile,
      $.newline,
    )),

    // Lines
    comment_line: $ => seq($.comment, $.eol),
    include_line: $ => prec(2, seq(
      choice('include', '#include'),
      optional(seq('if', 'exists')),
      field('path', choice($.angle_path, $.pathish, $.include_path)),
      $.eol,
    )),

    abi_line: $ => seq(
      'abi',
      field('path', choice($.angle_path, $.pathish)),
      $.eol,
    ),

    // Tunables assignments like: @{var} = value  or  @{var} += value
    tunables_assignment_line: $ => prec(3, seq(
      field('var', $.tunable_var),
      field('op', $.tunable_op),
      field('value', $.tunable_value),
      $.eol,
    )),

    // Conditional variable assignments like: $FOO=true  or  ${VAR}=false  or  @FOO=""
    conditional_var_assignment_line: $ => prec(3, seq(
      field('var', $.conditional_var),
      /\s*/,
      '=',
      /\s*/,
      field('value', $.conditional_value),
      $.eol,
    )),

    // Top-level alias mapping
    alias_line: $ => seq(
      'alias',
      field('source', choice($.quoted_path, $.bare_path)),
      '->',
      field('target', choice($.quoted_path, $.bare_path)),
      $.eol,
    ),

    // Profile block
    profile: $ => seq(
      choice($.profile_header, $.profile_header_bare, $.profile_header_hat, $.profile_header_hat_keyword),
      $.newline,
      repeat(choice(
        $.comment_line,
        $.include_line,
        $.abi_line,
        // Keyword rules must come before file_rule and profile to avoid conflicts
        $.capability_rule_line,
        $.network_rule_line,
        $.file_directive_line,
        $.ptrace_rule_line,
        $.signal_rule_line,
        $.mount_rule_line,
        $.remount_rule_line,
        $.userns_rule_line,
        $.umount_rule_line,
        $.pivot_root_rule_line,
        $.dbus_rule_line,
        $.unix_rule_line,
        $.mqueue_rule_line,
        $.io_uring_rule_line,
        $.all_rule_line,
        $.link_rule_line,
        $.change_profile_rule_line,
        $.rlimit_rule_line,
        $.conditional_rule,
        $.modifier_block,
        // Generic rules come after keyword rules
        $.exec_rule_line,
        $.file_rule_line,
        $.profile,
        $.newline,
      )),
      '}',
    ),

    // Modifier block: audit { rules }, deny { rules }, owner { rules }, etc.
    modifier_block: $ => prec(3, seq(
      optional($.rule_modifiers),
      optional(choice('owner', 'other')),
      '{',
      $.newline,
      repeat(choice(
        $.comment_line,
        $.include_line,
        $.file_rule_line,
        $.exec_rule_line,
        $.capability_rule_line,
        $.network_rule_line,
        $.dbus_rule_line,
        $.unix_rule_line,
        $.signal_rule_line,
        $.ptrace_rule_line,
        $.mount_rule_line,
        $.link_rule_line,
        $.change_profile_rule_line,
        $.file_directive_line,
        $.modifier_block,
        $.newline,
      )),
      '}',
    )),

    profile_header: $ => seq(
      'profile',
      field('name', choice($.profile_name, $.pathish)),
      optional(repeat1(field('attachment', $.pathish))),
      optional($.xattrs),
      optional($.flags),
      '{',
    ),

    // Support bare profile headers like
    //   /usr/sbin/xinetd {
    //   :ns:name /attachment {
    // and optionally with attachments and flags, mirroring yacc behavior
    profile_header_bare: $ => seq(
      // Bare headers can begin with a path-like token or namespace prefix
      field('name', choice($.pathish, $.ns_profile_name)),
      optional(repeat1(field('attachment', $.pathish))),
      optional($.xattrs),
      optional($.flags),
      '{',
    ),

    // Namespace-prefixed profile name: :ns:name or :ns://name
    ns_profile_name: $ => token(seq(':', /[^\s\{\r\n]+/)),

    // Hat (child) profile header with caret prefix
    //   ^hatname {
    //   ^hatname flags=(attach_disconnected) {
    profile_header_hat: $ => seq(
      '^',
      field('name', $.profile_name),
      optional($.xattrs),
      optional($.flags),
      '{',
    ),

    // Hat (child) profile header with hat keyword
    //   hat hatname {
    //   hat hatname flags=(attach_disconnected) {
    profile_header_hat_keyword: $ => seq(
      'hat',
      field('name', $.profile_name),
      optional($.xattrs),
      optional($.flags),
      '{',
    ),

    // Exec transition rule: PATH MODE [-> TARGET] [,]
    // Also supports front-exec pattern: [unsafe|safe] MODE PATH [-> TARGET]
    exec_rule_line: $ => choice(
      // Standard: PATH MODE [-> TARGET]
      seq(
        optional($.priority_prefix),
        field('path', $.pathish),
        field('mode', $.exec_mode),
        optional(seq('->', field('target', $.targetish))),
        $.eol,
      ),
      // Front-exec: [unsafe|safe] MODE PATH [-> TARGET]
      seq(
        optional($.priority_prefix),
        optional(choice('unsafe', 'safe')),
        field('mode', $.exec_mode),
        field('path', $.pathish),
        optional(seq('->', field('target', $.targetish))),
        $.eol,
      ),
    ),
    // Minimal file rule: [priority=N] [modifiers] [owner|other] (PATH PERMS | PERMS PATH) [,]
    file_rule_line: $ => seq(
      optional($.priority_prefix),
      optional($.rule_modifiers),
      optional(choice('owner', 'other')),
      choice(
        seq(
          field('path', $.pathish),
          field('perms', $.perm_set),
        ),
        seq(
          field('perms', $.perm_set),
          field('path', $.pathish),
        ),
      ),
      optional(seq('->', field('target', $.targetish))),
      $.eol,
    ),

    // Specific rule stubs - use precedence to prefer keywords over generic paths
    alias_rule_line: $ => prec(2, seq('alias', field('rest', $.rest_of_line), $.newline)),
    capability_rule_line: $ => prec(2, seq(optional($.rule_modifiers), 'capability', optional(field('rest', $.rest_of_line)), $.eol)),
    // Allow optional modifiers (deny/audit) before network; allow bare `network,`
    network_rule_line: $ => prec(2, seq(optional($.rule_modifiers), 'network', optional(field('rest', $.rest_of_line)), $.eol)),
    // User namespaces directive
    userns_rule_line: $ => prec(4, seq(
      optional($.rule_modifiers),
      'userns',
      optional(field('rest', $.rest_of_line)),
      $.eol,
    )),
    umount_rule_line: $ => seq(
      optional($.rule_modifiers),
      'umount',
      optional(seq('fstype=', token(/[^,\s\r\n]+/))),
      optional(field('path', $.pathish)),
      $.eol,
    ),
    ptrace_rule_line: $ => prec(2, seq(optional($.rule_modifiers), 'ptrace', optional(field('rest', $.rest_of_line)), $.eol)),
    // Signal rule with multiline continuation support
    signal_rule_line: $ => prec(2, seq(
      optional($.rule_modifiers),
      'signal',
      optional(field('first', $.signal_fragment)),
      repeat(field('cont', $.signal_cont_fragment)),
      $.eol,
    )),
    signal_fragment: $ => token(/[^\r\n]+/),
    signal_cont_fragment: $ => seq($.newline, /[\t ]+/, token(/[^\r\n]+/)),
    // File family directive: allow optional priority/owner|other/modifiers and optional transition target
    // Forms: `file,` | `file PERMS PATH [-> TARGET],` | `file PATH PERMS [-> TARGET],`
    // Also: `file [unsafe|safe] EXEC_MODE PATH [-> TARGET],`
    // possibly with `priority=NUM` prefix
    file_directive_line: $ => prec(2, choice(
      seq(
        optional($.priority_prefix), optional($.rule_modifiers), optional(choice('owner', 'other')), 'file',
        $.eol,
      ),
      seq(
        optional($.priority_prefix), optional($.rule_modifiers), optional(choice('owner', 'other')), 'file',
        field('perms', $.perm_set),
        field('path', $.pathish),
        optional(seq('->', field('target', $.targetish))),
        $.eol,
      ),
      seq(
        optional($.priority_prefix), optional($.rule_modifiers), optional(choice('owner', 'other')), 'file',
        field('path', $.pathish),
        field('perms', $.perm_set),
        optional(seq('->', field('target', $.targetish))),
        $.eol,
      ),
      // Front-exec with file keyword: file [unsafe|safe] EXEC_MODE PATH
      seq(
        optional($.priority_prefix), optional($.rule_modifiers), optional(choice('owner', 'other')), 'file',
        optional(choice('unsafe', 'safe')),
        field('mode', $.exec_mode),
        field('path', $.pathish),
        optional(seq('->', field('target', $.targetish))),
        $.eol,
      ),
    )),
    mount_rule_line: $ => prec(2, seq(optional($.rule_modifiers), 'mount', optional(field('rest', $.rest_of_line)), $.eol)),
    remount_rule_line: $ => seq(
      optional($.rule_modifiers),
      'remount',
      optional(seq('options=', '(', token(/[^)\r\n]*/), ')')), // options=(...)
      optional(field('path', $.pathish)),
      $.eol,
    ),
    mqueue_rule_line: $ => seq(
      optional($.rule_modifiers),
      'mqueue',
      optional(field('rest', $.rest_of_line)),
      $.eol,
    ),
    io_uring_rule_line: $ => seq(
      optional($.rule_modifiers),
      'io_uring',
      optional(field('rest', $.rest_of_line)),
      $.eol,
    ),
    // Multiline dbus rule: first line after 'dbus', then one or more continued indented lines, ending with optional comma
    // Can also be bare "dbus,"
    dbus_rule_line: $ => seq(
      optional($.rule_modifiers),
      'dbus',
      optional(field('first', $.dbus_fragment)),
      repeat(field('cont', $.dbus_cont_fragment)),
      $.eol,
    ),
    // Multiline unix rule: similar to dbus, can span multiple indented lines
    unix_rule_line: $ => prec(2, seq(
      optional($.rule_modifiers),
      'unix',
      optional(field('first', $.unix_fragment)),
      repeat(field('cont', $.unix_cont_fragment)),
      $.eol,
    )),
    // A permissive catch-all directive occasionally used in profiles: `all,`
    // Allow modifiers like `allow all,` or `deny all,`
    all_rule_line: $ => prec(4, seq(optional($.rule_modifiers), 'all', $.eol)),
    link_rule_line: $ => prec(2, seq(
      optional($.priority_prefix),
      optional($.rule_modifiers),
      optional(choice('owner', 'other')),
      'link',
      optional('subset'),
      field('source', $.pathish),
      '->',
      field('target', $.pathish),
      $.eol,
    )),
    change_profile_rule_line: $ => prec(2, seq(
      optional($.rule_modifiers),
      'change_profile',
      optional(choice('unsafe', 'safe')),
      optional($.exec_mode),
      optional(field('exec', $.pathish)),
      optional(seq('->', field('target', $.targetish))),
      $.eol,
    )),

    // Resource limit rules: set rlimit LIMIT <= VALUE [UNIT],
    rlimit_rule_line: $ => prec(2, seq(
      'set',
      'rlimit',
      field('limit', $.rlimit_name),
      '<=',
      field('value', $.rlimit_value),
      optional(field('unit', $.rlimit_unit)),
      $.eol,
    )),
    rlimit_name: $ => token(/[a-z_]+/),
    rlimit_value: $ => token(/-?[0-9]+|infinity/),
    rlimit_unit: $ => token(/[A-Za-z]+/),

    // Conditional blocks: if EXPR { rules } [else { rules }]
    conditional_rule: $ => prec(3, seq(
      'if',
      field('condition', $.cond_expr),
      '{',
      $.newline,
      repeat(choice(
        $.comment_line,
        $.include_line,
        $.file_rule_line,
        $.exec_rule_line,
        $.capability_rule_line,
        $.network_rule_line,
        $.dbus_rule_line,
        $.unix_rule_line,
        $.signal_rule_line,
        $.ptrace_rule_line,
        $.mount_rule_line,
        $.remount_rule_line,
        $.umount_rule_line,
        $.pivot_root_rule_line,
        $.userns_rule_line,
        $.mqueue_rule_line,
        $.io_uring_rule_line,
        $.link_rule_line,
        $.change_profile_rule_line,
        $.all_rule_line,
        $.rlimit_rule_line,
        $.file_directive_line,
        $.conditional_rule,
        $.profile,
        $.newline,
      )),
      '}',
      optional(seq(
        'else',
        choice(
          $.conditional_rule,
          seq('{', $.newline, repeat(choice(
            $.comment_line,
            $.include_line,
            $.file_rule_line,
            $.exec_rule_line,
            $.capability_rule_line,
            $.network_rule_line,
            $.dbus_rule_line,
            $.unix_rule_line,
            $.signal_rule_line,
            $.ptrace_rule_line,
            $.mount_rule_line,
            $.remount_rule_line,
            $.umount_rule_line,
            $.pivot_root_rule_line,
            $.userns_rule_line,
            $.mqueue_rule_line,
            $.io_uring_rule_line,
            $.link_rule_line,
            $.change_profile_rule_line,
            $.all_rule_line,
            $.rlimit_rule_line,
            $.file_directive_line,
            $.conditional_rule,
            $.profile,
            $.newline,
          )), '}'),
        ),
      )),
    )),

    // Condition expression: [not]* (defined @VAR | $VAR)
    cond_expr: $ => seq(
      repeat('not'),
      choice(
        seq('defined', $.cond_var),
        $.cond_bool_var,
      ),
    ),
    cond_var: $ => token(seq('@', /[A-Za-z_][A-Za-z0-9_]*/)),
    cond_bool_var: $ => token(choice(
      seq('$', /[A-Za-z_][A-Za-z0-9_]*/),
      seq('${', /[A-Za-z_][A-Za-z0-9_]*/, '}'),
    )),


    // Tokens
    // Exec modes: optional 'r' prefix, then one of
    // - ix
    // - px/Px, cx/Cx, ux/Ux
    // - fallback variants: pix/Pix/cix/Cix and pux/PUx/cux/CUx
    exec_mode: $ => token(/r?(?:ix|[pPcCuU]x|[pPcC][iIuU]x)/),
    comment: $ => token(seq('#', /[^\r\n]*/)),
    angle_path: $ => token(seq('<', /[^>\r\n]+/, '>')),
    quoted_path: $ => token(seq('"', /[^"\r\n]+/, '"')),
    // Bare relative paths for includes (e.g., simple_tests/foo.include)
    // Must contain at least one / to distinguish from keywords
    include_path: $ => token(/[A-Za-z0-9_.][A-Za-z0-9_.\-]*\/[^\s\r\n,]*/),
    // Paths should start like real paths. Variable paths are handled separately to avoid matching tunables
    // Allow glob patterns with braces containing commas like {,**} or {a,b,c}
    // Allow standalone / or ~ as paths
    // Bare paths: allow escaped spaces (\ ) and glob braces
    bare_path: $ => token(seq(choice('/', '~'), /([^\s\r\n]|\{[^}]*\}|\\ )*/)),
    // var_path must have at least one char after } to distinguish from tunable_var
    // Do not allow the very first suffix char to be '=' or '+' to avoid
    // conflicting with tunables assignments, but allow '=' later in the suffix.
    var_path: $ => token(seq('@{', /[^}\r\n]+/, '}', /[^\s\r\n+=]/, /[^\s\r\n]*/)),
    newline: $ => token(/\r?\n/),

    // Profile name: allows embedded @{var} patterns
    // Must not start with lone { but @{ is okay
    // Not a token so keywords can take precedence
    profile_name: $ => /([^\s\{\r\n]|@\{[^}]+\})+/,

    // xattrs: support extended attributes in profile headers
    // Examples: xattrs=(myvalue=foo)
    //           xattrs=(key1=val1, key2=val2)
    xattrs: $ => seq(
      'xattrs',
      optional('='),
      '(',
      $.xattr_entry,
      repeat(seq(optional(','), $.xattr_entry)),
      ')',
    ),
    xattr_entry: $ => seq(
      field('key', token(/[A-Za-z0-9_.+\-]+/)),
      optional(seq('=', field('value', choice(
        $.quoted_path,
        $.flags_bare_path,
        $.flags_var_path,
        $.tunable_var,
        $.flags_value,
      )))),
    ),

    // flags: support entries like 'key' or 'key=value' and dotted keys
    // Examples: flags=(attach_disconnected, mediate_deleted)
    //           (attach_disconnected, mediate_deleted)  <- bare form without 'flags=' prefix
    //           flags=(attach_disconnected.path=/apparmor/disconnected/)
    flags: $ => seq(
      optional(seq('flags', optional('='))),
      '(',
      $.flag_entry,
      repeat(seq(optional(','), $.flag_entry)),
      ')',
    ),
    flag_entry: $ => seq(
      field('key', token(/[A-Za-z0-9_.+\-]+/)),
      optional(seq('=', field('value', choice(
        $.quoted_path,
        $.flags_bare_path,
        $.flags_var_path,
        $.tunable_var,
        $.flags_value,
      )))),
    ),
    // Bare identifier values for flags (e.g., kill.signal=hup)
    flags_value: $ => token(/[A-Za-z0-9_.+\-]+/),
    // Context-specific path tokens for flags values that must not consume ')'
    flags_bare_path: $ => token(seq(choice('/', '~'), /([^\s\r\n)]|\{[^}]*\})*/)),
    flags_var_path: $ => token(seq('@{', /[^}\r\n]+/, '}', /[^\s\r\n+=)]/, /[^\s\r\n)]*/)),

    // Allow braces inside rule argument lists (e.g., peer=(addr=...))
    rest_of_line: $ => token(/[^\r\n,].*/),
    dbus_fragment: $ => token(/[^\r\n]+/),
    dbus_cont_fragment: $ => seq($.newline, /[\t ]+/, token(/[^\r\n]+/)),
    unix_fragment: $ => token(/[^\r\n]+/),
    unix_cont_fragment: $ => seq($.newline, /[\t ]+/, token(/[^\r\n]+/)),

    // Identifiers that may include embedded tunable variables, used for profile targets
    identifier_with_vars: $ => token(/(?:[^\s,\r\n]|@\{[^}\r\n]+\})+/),

    // Modifiers and perms
    // Keep modifiers narrow to avoid capturing keywords like 'include'
    // Use string literals instead of tokens to avoid conflicts with profile_name
    // Rule modifiers must be in correct order: [audit] [allow|deny|prompt]
    // "deny audit" is invalid, "audit deny" is valid
    rule_modifiers: $ => choice(
      seq('audit', optional(choice('allow', 'deny', 'prompt'))),
      choice('allow', 'deny', 'prompt'),
    ),
    // File permission set; exclude comma and assignment operators
    // Valid permissions: r, w, a, l, m, k, x and exec modes like px, ix, ux, cx
    perm_set: $ => token(/[rwalkixmRWALKIXMpPcCuU]+/),

    // Priority prefix used in some abstractions: `priority=1`, `priority=-1`, or `priority=+5`
    priority_prefix: $ => seq('priority', '=', token(/[+-]?\d+/), /\s+/),

    // pivot_root: optional oldroot=PATH followed by optional PATH; can be bare "pivot_root,"
    pivot_root_rule_line: $ => seq(
      optional($.rule_modifiers),
      'pivot_root',
      optional(seq('oldroot=', field('oldroot', choice($.quoted_path, $.bare_path, $.var_path)), /\s+/)),
      optional(field('path', choice($.quoted_path, $.bare_path, $.var_path))),
      $.eol,
    ),

    // Tunables tokens
    // Variable names must start with a letter, then alphanumeric/underscore
    tunable_var: $ => token(seq('@{', /[A-Za-z][A-Za-z0-9_]*/, '}')),
    tunable_op: $ => token(choice('+=', '=')),
    tunable_value: $ => token(/[\S].*/),
    // Conditional variable tokens: $FOO, ${VAR}, @FOO
    conditional_var: $ => token(choice(
      seq('$', /[A-Za-z_][A-Za-z0-9_]*/),
      seq('${', /[A-Za-z_][A-Za-z0-9_]*/, '}'),
      seq('@', /[A-Za-z_][A-Za-z0-9_]*/),
    )),
    // Conditional values must be true/false (any case) or quoted string
    conditional_value: $ => token(choice(
      seq('"', /[^"\r\n]*/, '"'),
      /[tT][rR][uU][eE]/,
      /[fF][aA][lL][sS][eE]/,
    )),
    // Helpers
    pathish: $ => choice($.quoted_path, $.bare_path, $.var_path, $.tunable_var),
    targetish: $ => choice($.pathish, $.profile_name, $.identifier_with_vars),
    eol: $ => seq(
      optional(','),
      optional($.comment),
      $.newline,
    ),
  },
});

