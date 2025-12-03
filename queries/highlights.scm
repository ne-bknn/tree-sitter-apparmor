; Tree-sitter highlight queries for AppArmor profiles

; ----------------------------------------
; Comments
; ----------------------------------------
(comment) @comment
(comment_line) @comment

; ----------------------------------------
; Strings and paths
; ----------------------------------------
(quoted_path) @string
(angle_path) @string.special
(bare_path) @string.special
(include_path) @string.special
(flags_bare_path) @string.special
(var_path) @string.special
(flags_var_path) @variable
(tunable_var) @variable
(identifier_with_vars) @variable

; ----------------------------------------
; Keywords
; ----------------------------------------
[
  "include" "#include" "if" "exists" "else" "abi" "profile" "flags"
  "alias" "capability" "network" "userns" "umount" "ptrace" "signal"
  "file" "mount" "remount" "mqueue" "io_uring" "dbus" "unix" "all"
  "link" "change_profile" "owner" "other" "hat"
  "set" "rlimit" "not" "defined"
  "unsafe" "safe" "subset" "xattrs"
] @keyword

; Rule modifiers
(rule_modifiers) @keyword

; Exec modes and permission sets
(exec_mode) @constant.builtin
(perm_set) @constant

; ----------------------------------------
; Tunables and conditional variables
; ----------------------------------------
; Tunables assignment
(tunables_assignment_line
  var: (tunable_var) @variable
  op: (tunable_op) @operator
  value: (tunable_value) @string)

(tunable_op) @operator

; Conditional variable assignments
(conditional_var_assignment_line
  var: (conditional_var) @variable
  value: (conditional_value) @string)

(conditional_var) @variable
(conditional_value) @constant.builtin

; ----------------------------------------
; Profiles and hats
; ----------------------------------------
; Profile names (treat as types)
(profile_header
  name: (_) @type
  attachment: (_) @string.special)

(profile_header_bare
  name: (_) @type
  attachment: (_) @string.special)

(profile_header_hat
  name: (_) @type)

(profile_header_hat_keyword
  name: (_) @type)

; Namespace-prefixed profile names
(ns_profile_name) @type

; ----------------------------------------
; Extended attributes and flags
; ----------------------------------------
; Extended attributes
(xattrs) @keyword
(xattr_entry
  key: (_) @attribute)
(xattr_entry
  value: (quoted_path) @string)
(xattr_entry
  value: (flags_bare_path) @string.special)
(xattr_entry
  value: (flags_var_path) @variable)
(xattr_entry
  value: (tunable_var) @variable)
(xattr_entry
  value: (flags_value) @constant)

; Flags structure
(flags) @keyword
(flag_entry
  key: (_) @attribute)
(flag_entry
  value: (quoted_path) @string)
(flag_entry
  value: (tunable_var) @variable)
(flag_entry
  value: (flags_bare_path) @string.special)
(flag_entry
  value: (flags_var_path) @variable)
(flag_entry
  value: (flags_value) @constant)

; ----------------------------------------
; Conditional rules
; ----------------------------------------
(conditional_rule) @keyword.control

(cond_expr) @keyword.control
(cond_var) @variable
(cond_bool_var) @variable

; ----------------------------------------
; Resource limits
; ----------------------------------------
(rlimit_rule_line) @keyword
(rlimit_rule_line
  limit: (rlimit_name) @constant.builtin
  value: (rlimit_value) @number
  unit: (rlimit_unit) @constant)

(rlimit_name) @constant.builtin
(rlimit_value) @number
(rlimit_unit) @constant

; ----------------------------------------
; Operators
; ----------------------------------------
"->" @operator
"<=" @operator
"=" @operator

; ----------------------------------------
; Attributes and properties
; ----------------------------------------
"priority" @attribute
"fstype=" @property
"oldroot=" @property
"options=" @property

; Priority prefix (cannot isolate number token; highlight whole prefix)
(priority_prefix) @attribute

; ----------------------------------------
; Punctuation
; ----------------------------------------
["{" "}" "(" ")"] @punctuation.bracket
[","] @punctuation.delimiter

; ----------------------------------------
; Multiline rule fragments
; ----------------------------------------
; D-Bus fragments
(dbus_fragment) @string.special
(dbus_cont_fragment) @string.special

; Unix rule fragments
(unix_fragment) @string.special
(unix_cont_fragment) @string.special

; Signal rule fragments
(signal_fragment) @string.special
(signal_cont_fragment) @string.special

; Generic rest-of-line chunks
(rest_of_line) @string.special

; ----------------------------------------
; Field-focused captures for clarity
; ----------------------------------------
(include_line
  path: (_) @string.special)

(abi_line
  path: (_) @string.special)

(exec_rule_line
  path: (_) @string.special)
(exec_rule_line
  target: (_) @string.special)

(file_rule_line
  path: (_) @string.special)
(file_rule_line
  target: (_) @string.special)

(file_directive_line
  path: (_) @string.special)
(file_directive_line
  target: (_) @string.special)
(file_directive_line
  mode: (_) @constant.builtin)

(link_rule_line
  source: (_) @string.special
  target: (_) @string.special)

(change_profile_rule_line
  exec: (_) @string.special
  target: (_) @string.special)
(change_profile_rule_line
  mode: (_) @constant.builtin)

(umount_rule_line
  path: (_) @string.special)

(remount_rule_line
  path: (_) @string.special)

(pivot_root_rule_line
  oldroot: (_) @string.special
  path: (_) @string.special)

; Modifier blocks
(modifier_block) @keyword

