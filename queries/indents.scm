; Indentation rules for AppArmor grammar

; Profile blocks increase indent after opening brace
(profile) @indent.begin

; Modifier blocks increase indent
(modifier_block) @indent.begin

; Conditional blocks increase indent
(conditional_rule) @indent.begin

; Closing braces decrease indent
"}" @indent.end @indent.branch

; Opening braces mark indent begin points
"{" @indent.begin

; Multiline continuation fragments should be indented
(dbus_cont_fragment) @indent.dedent
(unix_cont_fragment) @indent.dedent
(signal_cont_fragment) @indent.dedent

; Flags and xattrs with parentheses
(flags
  "(" @indent.begin
  ")" @indent.end)

(xattrs
  "(" @indent.begin
  ")" @indent.end)
