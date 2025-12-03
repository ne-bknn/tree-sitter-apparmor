import XCTest
import SwiftTreeSitter
import TreeSitterApparmor

final class TreeSitterApparmorTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_apparmor())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading AppArmor grammar")
    }
}
